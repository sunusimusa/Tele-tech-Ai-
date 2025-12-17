const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

// ===== OpenAI =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ===== Files =====
const USERS_FILE = path.join(__dirname, "data", "users.json");

// ===== Helpers =====
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ===== ROUTES =====
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  const users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, message: "User already exists" });
  }

  users.push({
    email,
    password,
    plan: "free"
  });

  saveUsers(users);
  res.json({ success: true });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Invalid login" });
  }

  res.json({
    success: true,
    user: {
      email: user.email,
      plan: user.plan
    }
  });
});

// ===== CHAT (AI TEXT) =====
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ success: false, reply: "Empty message" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      reply: "AI error"
    });
  }
});

// ===== START =====
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
