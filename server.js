const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===== OPENAI ===== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===== USERS STORAGE ===== */
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

/* ===== HOME ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===== CHAT ===== */
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;
    if (!message || !email) {
      return res.json({ reply: "Missing message or email" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);
    const isPro = user && user.plan === "pro";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content,
      pro: isPro
    });
  } catch (err) {
    console.error(err);
    res.json({ reply: "AI error" });
  }
});

/* ===== IMAGE (PRO) ===== */
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt, email } = req.body;
    if (!prompt || !email) {
      return res.json({ error: "Missing prompt or email" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || user.plan !== "pro") {
      return res.json({ error: "❌ Wannan feature na PRO ne." });
    }

    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    res.json({ image: img.data[0].url });
  } catch (err) {
    console.error(err);
    res.json({ error: "Image generation failed" });
  }
});

/* ===== PAYMENT ===== */
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

/* ===== ADMIN ===== */
app.post("/admin/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    return res.json({ token: "admin-token" });
  }
  res.json({ error: "Wrong password" });
});

app.get("/admin/users", (req, res) => {
  if (req.headers.authorization !== "admin-token") {
/* ===== ADMIN AUTH ===== */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
let ADMIN_TOKEN = null;
/* ===== ADMIN AUTH ===== */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/* ===== ADMIN LOGIN ===== */
app.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    return res.json({ token: "admin-token" });
  }

  res.status(401).json({ error: "Wrong password" });
});

/* ===== GET USERS ===== */
app.get("/admin/users", (req, res) => {
  const token = req.headers.authorization;

  if (token !== "admin-token") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(getUsers());
});

/* ===== TOGGLE USER PLAN ===== */
app.post("/admin/toggle", (req, res) => {
  const token = req.headers.authorization;
  const { email } = req.body;

  if (token !== "admin-token") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let users = getUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.plan = user.plan === "pro" ? "free" : "pro";
  saveUsers(users);

  res.json({ success: true });
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
