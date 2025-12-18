// ===== IMPORTS =====
const express = require("express");
const path = require("path");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;
const fs = require("fs");

const USERS_FILE = "./data/users.json";

function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function upgradeUserToPro(email) {
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (user) {
    user.plan = "pro";
    saveUsers(users);
    console.log("🚀 User upgraded to PRO:", email);
  } else {
    console.log("⚠️ User not found:", email);
  }
}

// ===== OPENAI =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== CHAT API =====
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.json({ reply: "No message received" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.json({ reply: "AI error" });
  }
});

// ===== PAYMENT API (FLUTTERWAVE) =====
app.post("/pay", async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.json({ error: "Missing payment data" });
    }

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "teletech_" + Date.now(),
        amount: amount,
        currency: "NGN",
        redirect_url: "https://tele-tech-ai.onrender.com/success.html",
        customer: { email },
        customizations: {
          title: "Tele Tech AI Pro",
          description: "Upgrade to Pro Plan"
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
    res.status(500).json({ error: "Payment initialization failed" });
  }
});
// ===== FLUTTERWAVE WEBHOOK =====
app.post("/webhook", express.json(), (req, res) => {
  const secretHash = process.env.FLW_WEBHOOK_SECRET;
  const signature = req.headers["verif-hash"];

  if (!signature || signature !== secretHash) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  // idan payment ya yi nasara
  if (event.event === "charge.completed" && event.data.status === "successful") {
    const email = event.data.customer.email;

    console.log("✅ Payment successful for:", email);

    // 👉 anan ne zaka sa USER ya koma PRO (a gaba)
  }

  res.status(200).send("OK");
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
