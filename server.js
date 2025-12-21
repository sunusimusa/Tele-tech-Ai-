const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const OpenAI = require("openai");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 10000;

/* ================= OPENAI ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================= ADMIN MIDDLEWARE ================= */
function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= PAGES ================= */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "register.html"))
);

app.get("/app", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "app.html"))
);

app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin.html"))
);

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, error: "Missing data" });

  const hash = await bcrypt.hash(password, 10);
  const today = new Date().toISOString().slice(0, 10);

  db.run(
    `INSERT INTO users (email, password, lastUsed)
     VALUES (?, ?, ?)`,
    [email, hash, today],
    err => {
      if (err) {
        return res.json({ success: false, error: "User exists" });
      }
      res.json({ success: true });
    }
  );
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (!user)
        return res.json({ success: false, error: "User not found" });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok)
        return res.json({ success: false, error: "Wrong password" });

      res.json({
        success: true,
        email: user.email,
        plan: user.plan,
        verified: !!user.verified
      });
    }
  );
});

/* ================= VERIFY ================= */
app.post("/verify", (req, res) => {
  const { email } = req.body;

  db.run(
    `UPDATE users SET verified = 1 WHERE email = ?`,
    [email],
    function () {
      res.json({ success: true });
    }
  );
});

/* ================= GENERATE IMAGE ================= */
app.post("/generate", async (req, res) => {
  const { email, prompt } = req.body;
  if (!email || !prompt)
    return res.status(400).json({ error: "Missing data" });

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (!user)
        return res.status(401).json({ error: "User not found" });

      if (!user.verified)
        return res.status(403).json({ error: "Verify account first" });

      const today = new Date().toISOString().slice(0, 10);
      let dailyCount = user.dailyCount;

      if (user.lastUsed !== today) {
        dailyCount = 0;
      }

      if (user.plan === "free" && dailyCount >= 5) {
        return res.status(403).json({
          error: "Daily limit reached. Upgrade to PRO"
        });
      }

      try {
        const img = await openai.images.generate({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024"
        });

        db.run(
          `UPDATE users
           SET dailyCount = ?, lastUsed = ?
           WHERE email = ?`,
          [dailyCount + 1, today, email]
        );

        res.json({
          image: img.data[0].url,
          remaining:
            user.plan === "free" ? 5 - (dailyCount + 1) : "unlimited"
        });
      } catch (e) {
        res.status(500).json({ error: "Image generation failed" });
      }
    }
  );
});

/* ================= UPGRADE ================= */
app.post("/upgrade", (req, res) => {
  const { email } = req.body;

  db.run(
    `UPDATE users SET plan = 'pro' WHERE email = ?`,
    [email],
    () => res.json({ success: true })
  );
});

/* ================= ADMIN USERS ================= */
app.get("/admin/users", requireAdmin, (req, res) => {
  db.all(`SELECT email, plan, verified, dailyCount FROM users`, [], (err, rows) =>
    res.json(rows)
  );
});

/* ================= ADMIN STATS ================= */
app.get("/admin/stats", requireAdmin, (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, users) => {
    res.json({
      users: users.length,
      pro: users.filter(u => u.plan === "pro").length,
      verified: users.filter(u => u.verified).length
    });
  });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
