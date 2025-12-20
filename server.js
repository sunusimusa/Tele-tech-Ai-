const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 10000;

/* ========= CONFIG ========= */
const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_123";

/* ========= USERS FILE ========= */
const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ========= MIDDLEWARE ========= */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const path = require("path");

app.use(express.json());
app.use(express.static("public"));

/* ========= PAGES ========= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

/* ========= REGISTER ========= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ error: "Missing email or password" });
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return res.json({ error: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hashed,
    plan: "free"
  });

  saveUsers(users);
  res.json({ success: true });
});

/* ========= LOGIN ========= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

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
    plan: user.plan
  });
});
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;

    if (!message) {
      return res.json({ reply: "No message received" });
    }

    // TEST RESPONSE (domin mu tabbatar yana aiki)
    return res.json({
      reply: "Na karɓi saƙonka: " + message
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error" });
  }
});

/* ========= START ========= */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
