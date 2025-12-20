const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===== FILE ===== */
const USERS_FILE = path.join(__dirname, "data", "users.json");

/* ===== HELPERS ===== */
function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== ROUTES ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===== REGISTER ===== */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, error: "Missing fields" });
  }

  const users = getUsers();

  if (users.find(u => u.email === email)) {
    return res.json({ success: false, error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hashedPassword,
    plan: "free"
  });

  saveUsers(users);

  res.json({ success: true });
});

/* ===== LOGIN ===== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, error: "Email da password suna da muhimmanci" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.json({ success: false, error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.json({ success: false, error: "Wrong password" });
    }

    res.json({
      success: true,
      email: user.email,
      plan: user.plan || "free"
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
