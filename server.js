const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔑 SERVE PUBLIC FOLDER
app.use(express.static(path.join(__dirname, "public")));

// 📁 USERS FILE
const USERS_FILE = path.join(__dirname, "data", "users.json");

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 🏠 LOGIN PAGE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📝 REGISTER
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ error: "All fields required" });
  }

  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    return res.json({ error: "User already exists" });
  }

  users.push({ email, password });
  saveUsers(users);

  res.json({ success: true });
});

// 🔐 LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.json({ error: "Invalid login" });
  }

  res.json({ success: true, email });
});

// 💬 CHAT PAGE (WANNAN NE MUHIMMI)
app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// 🤖 CHAT API (TEST RESPONSE)
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  res.json({
    reply: "Na karɓi saƙonka: " + message
  });
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
