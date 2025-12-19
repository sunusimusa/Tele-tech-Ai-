const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

/* ================== ENV ================== */
const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_123";

/* ================== OPENAI ================== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================== STORAGE ================== */
const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ================== MIDDLEWARE ================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================== HOME ================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================== AUTH ================== */

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing data" });

  let users = getUsers();
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

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ error: "Invalid login" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ error: "Invalid login" });

  const token = jwt.sign(
    { email: user.email, plan: user.plan },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, plan: user.plan });
});

/* ================== AUTH CHECK ================== */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(header, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ================== CHAT ================== */
app.post("/chat", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ reply: "No message" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content,
      plan: req.user.plan
    });

  } catch (e) {
    res.json({ reply: "AI error" });
  }
});

/* ================== IMAGE (PRO) ================== */
app.post("/generate-image", auth, async (req, res) => {
  if (req.user.plan !== "pro") {
    return res.json({ error: "❌ PRO only feature" });
  }

  const { prompt } = req.body;
  if (!prompt) return res.json({ error: "Missing prompt" });

  try {
    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    res.json({ image: img.data[0].url });

  } catch {
    res.json({ error: "Image error" });
  }
});

/* ================== PAYMENT ================== */
app.post("/pay", auth, async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "tele_" + Date.now(),
        amount: 1000,
        currency: "NGN",
        redirect_url: "https://tele-tech-ai.onrender.com",
        customer: { email: req.user.email },
        customizations: {
          title: "Tele Tech AI Pro",
          description: "Upgrade to Pro"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ link: response.data.data.link });

  } catch {
    res.json({ error: "Payment error" });
  }
});

/* ================== WEBHOOK ================== */
app.post("/webhook", (req, res) => {
  const signature = req.headers["verif-hash"];
  if (signature !== process.env.FLW_WEBHOOK_SECRET) {
    return res.status(401).send("Invalid");
  }

  const event = req.body;

  if (event.event === "charge.completed" &&
      event.data.status === "successful") {

    const email = event.data.customer.email;
    let users = getUsers();
    let user = users.find(u => u.email === email);

    if (user) user.plan = "pro";
    else users.push({ email, password: "", plan: "pro" });

    saveUsers(users);
    console.log("✅ AUTO-UPGRADED:", email);
  }

  res.send("OK");
});

/* ================== START ================== */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
