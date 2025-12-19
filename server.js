const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===== ENV ===== */
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/* ===== OPENAI ===== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===== USERS FILE ===== */
const USERS_FILE = path.join(__dirname, "data", "users.json");

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

/* ===== AUTH ===== */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ error: "Missing fields" });

  const users = getUsers();
  if (users.find(u => u.email === email))
    return res.json({ error: "User already exists" });

  const hash = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hash,
    plan: "free"
  });

  saveUsers(users);
  res.json({ success: true });
});

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

  res.json({
    success: true,
    token,
    email: user.email,
    plan: user.plan
  });
});

/* ===== CHAT ===== */
app.post("/chat", async (req, res) => {
  const { message, email } = req.body;
  if (!message || !email)
    return res.json({ reply: "Missing message or email" });

  const users = getUsers();
  const user = users.find(u => u.email === email);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }]
  });

  res.json({
    reply: completion.choices[0].message.content,
    pro: user && user.plan === "pro"
  });
});

/* ===== IMAGE (PRO) ===== */
app.post("/generate-image", async (req, res) => {
  const { prompt, email } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user || user.plan !== "pro")
    return res.json({ error: "PRO only feature" });

  const img = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024"
  });

  res.json({ image: img.data[0].url });
});

/* ===== PAY ===== */
app.post("/pay", async (req, res) => {
  const { email, amount } = req.body;

  const response = await axios.post(
    "https://api.flutterwave.com/v3/payments",
    {
      tx_ref: "tele_" + Date.now(),
      amount,
      currency: "NGN",
      redirect_url: "https://tele-tech-ai.onrender.com/",
      customer: { email }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    }
  );

  res.json({ link: response.data.data.link });
});

/* ===== WEBHOOK ===== */
app.post("/webhook", (req, res) => {
  const email = req.body?.data?.customer?.email;
  if (!email) return res.send("ok");

  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user) user.plan = "pro";

  saveUsers(users);
  res.send("ok");
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
