const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 10000;

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

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ error: "Missing data" });

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (email, password, lastUsed)
     VALUES (?, ?, ?)`,
    [email, hash, new Date().toISOString().slice(0, 10)],
    err => {
      if (err) return res.json({ error: "User exists" });
      res.json({ success: true });
    }
  );
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user)
        return res.json({ error: "User not found" });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok)
        return res.json({ error: "Wrong password" });

      res.json({
        success: true,
        email: user.email,
        plan: user.plan,
        verified: !!user.verified
      });
    }
  );
});

/* ================= IMAGE GENERATE (POLLINATIONS) ================= */
app.post("/generate", (req, res) => {
  const { email, prompt } = req.body;
  if (!email || !prompt)
    return res.json({ error: "Missing data" });

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, user) => {
      if (!user)
        return res.json({ error: "Unauthorized" });

      const today = new Date().toISOString().slice(0, 10);

      let daily = user.dailyCount;
      if (user.lastUsed !== today) daily = 0;

      if (user.plan === "free" && daily >= 3) {
        return res.json({
          error: "Free limit reached. Pay to download."
        });
      }

      const imageUrl =
        "https://image.pollinations.ai/prompt/" +
        encodeURIComponent(prompt);

      db.run(
        `UPDATE users
         SET dailyCount = ?, lastUsed = ?
         WHERE email = ?`,
        [daily + 1, today, email]
      );

      res.json({
        image: imageUrl,
        remaining:
          user.plan === "free" ? 3 - (daily + 1) : "unlimited"
      });
    }
  );
});

app.listen(PORT, () =>
  console.log("✅ Server running on port " + PORT)
);
