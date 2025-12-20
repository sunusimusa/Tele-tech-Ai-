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
    return res.json({ success: false, error: "Missing data" });
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, error: "Email already exists" });
  }

  const hash = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hash,
    plan: "free",
    usage: 0,
    lastUse: ""
  });

  saveUsers(users);
  res.json({ success: true });
});

/* ===== LOGIN ===== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email da password suna bukata" });
    }

    const users = readUsers(); // function ɗin da kake amfani da shi a register
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: "Account bai wanzu ba" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Password ba daidai ba" });
    }

    return res.json({
      success: true,
      email: user.email
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
