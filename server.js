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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/* ===== HOME ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===== CHAT ===== */
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;
    if (!message || !email) {
      return res.json({ reply: "❌ Missing message or email" });
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
    console.error("CHAT ERROR:", err);
    res.json({ reply: "AI error ❌" });
  }
});

/* ===== IMAGE GENERATION (PRO ONLY) ===== */
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt, email } = req.body;
    if (!prompt || !email) {
      return res.json({ error: "Missing prompt or email" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || user.plan !== "pro") {
      return res.json({
        error: "❌ Wannan feature na PRO ne. Don Allah ka upgrade."
      });
    }

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    res.json({ image: image.data[0].url });

  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.status(500).json({ error: "Image generation failed ❌" });
  }
});

/* ===== PAYMENT ===== */
app.post("/pay", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "tele_" + Date.now(),
        amount,
        currency: "NGN",
        redirect_url: "https://tele-tech-ai.onrender.com/",
        customer: { email },
        customizations: {
          title: "Tele Tech AI Pro",
          description: "Pro Subscription"
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

  } catch (err) {
    console.error("PAY ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment failed" });
  }
});

/* ===== WEBHOOK ===== */
app.post("/webhook", (req, res) => {
  const signature = req.headers["verif-hash"];
  if (signature !== process.env.FLW_WEBHOOK_SECRET) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;
  if (event.event === "charge.completed" && event.data.status === "successful") {
    const email = event.data.customer.email;

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (user) user.plan = "pro";
    else users.push({ email, plan: "pro" });

    saveUsers(users);
    console.log("✅ USER UPGRADED:", email);
  }

  res.send("OK");
});
/* ===== ADMIN LOGIN ===== */
app.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});
app.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }

  res.json({ success: true });
});

app.get("/admin/users", (req, res) => {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(getUsers());
});

app.post("/admin/toggle", (req, res) => {
  if (req.headers.authorization !== "admin-token") {
    return res.status(401).send("Unauthorized");
  }

  const { email } = req.body;
  let users = getUsers();

  const user = users.find(u => u.email === email);
  if (user) {
    user.plan = user.plan === "pro" ? "free" : "pro";
    saveUsers(users);
  }

  res.send("OK");
});
/* ===== ADMIN USERS ===== */
app.post("/admin/users", (req, res) => {
  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }

  res.json(getUsers());
});

async function loadUsers() {
  const password = localStorage.getItem("adminPassword");

  const res = await fetch("/admin/users", {
    headers: {
      "x-admin-password": password
    }
  });

  const users = await res.json();
  console.log(users);
}

/* ===== START ===== */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
