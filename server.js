const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

/* ================= OPENAI ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================= STORAGE ================= */
const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

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

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, error: "Missing data" });

  const users = getUsers();
  if (users.find(u => u.email === email))
    return res.json({ success: false, error: "User already exists" });

  const hash = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hash,
    plan: "free",
    verified: false,
    dailyCount: 0,
    lastUsed: new Date().toISOString().slice(0, 10)
  });

  saveUsers(users);
  res.json({ success: true });
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user)
    return res.json({ success: false, error: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok)
    return res.json({ success: false, error: "Wrong password" });

  res.json({
    success: true,
    email: user.email,
    plan: user.plan,
    verified: user.verified
  });
});

/* ================= VERIFY ================= */
app.post("/verify", (req, res) => {
  const { email } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user)
    return res.status(404).json({ error: "User not found" });

  user.verified = true;
  saveUsers(users);

  res.json({ success: true });
});

/* ================= IMAGE GENERATE ================= */
app.post("/generate", async (req, res) => {
  try {
    const { email, prompt } = req.body;
    if (!email || !prompt)
      return res.status(400).json({ error: "Missing data" });

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user)
      return res.status(401).json({ error: "Unauthorized" });

    if (!user.verified)
      return res.status(403).json({ error: "Please verify account" });

    const today = new Date().toISOString().slice(0, 10);
    if (user.lastUsed !== today) {
      user.dailyCount = 0;
      user.lastUsed = today;
    }

    if (user.plan === "free" && user.dailyCount >= 5) {
      return res.status(403).json({
        error: "Daily free limit reached. Upgrade to Pro."
      });
    }

    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    user.dailyCount += 1;
    saveUsers(users);

    res.json({
      image: img.data[0].url,
      remaining:
        user.plan === "free" ? 5 - user.dailyCount : "unlimited"
    });

  } catch (err) {
    console.error("IMAGE ERROR:", err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});

/* ================= PRO UPGRADE ================= */
app.post("/upgrade", (req, res) => {
  const { email } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user)
    return res.status(404).json({ error: "User not found" });

  user.plan = "pro";
  saveUsers(users);

  res.json({ success: true, plan: "pro" });
});

/* ================= ADMIN ROUTES ================= */
app.get("/admin/users", requireAdmin, (req, res) => {
  res.json(getUsers());
});

app.get("/admin/stats", requireAdmin, (req, res) => {
  const users = getUsers();
  res.json({
    totalUsers: users.length,
    proUsers: users.filter(u => u.plan === "pro").length,
    verifiedUsers: users.filter(u => u.verified).length,
    totalImages: users.reduce(
      (sum, u) => sum + (u.dailyCount || 0),
      0
    )
  });
});

app.post("/admin/set-plan", requireAdmin, (req, res) => {
  const { email, plan } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user)
    return res.status(404).json({ error: "User not found" });

  user.plan = plan;
  saveUsers(users);

  res.json({ success: true });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
