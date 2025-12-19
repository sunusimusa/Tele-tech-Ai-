const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

/* ===== OPENAI ===== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===== USERS DB ===== */
const USERS_FILE = "./users.json";

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function ensureUser(email) {
  const users = getUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    user = { email, plan: "free" };
    users.push(user);
    saveUsers(users);
  }
  return user;
}

/* ===== CHAT API ===== */
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;

    if (!message || !email) {
      return res.json({ reply: "❌ Missing message or email" });
    }

    const user = ensureUser(email);

    if (user.plan !== "pro") {
      return res.json({
        reply: "❌ Wannan feature na PRO ne. Don Allah ka upgrade."
      });
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
    console.error(err);
    res.json({ reply: "AI error ❌" });
  }
});

/* ===== PAYMENT INIT ===== */
app.post("/pay", async (req, res) => {
  const { email, amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "tele_" + Date.now(),
        amount,
        currency: "NGN",
        redirect_url: "https://tele-tech-ai.onrender.com/success.html",
        customer: { email },
        customizations: {
          title: "Tele Tech AI Pro",
          description: "Pro Upgrade"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
        }
      }
    );

    res.json({ link: response.data.data.link });
  } catch (err) {
    console.error(err.response?.data);
    res.status(500).json({ error: "Payment failed" });
  }
});

/* ===== WEBHOOK ===== */
app.post("/webhook", (req, res) => {
  const secretHash = process.env.FLW_WEBHOOK_SECRET;
  const signature = req.headers["verif-hash"];

  if (!signature || signature !== secretHash) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (
    event.event === "charge.completed" &&
    event.data.status === "successful"
  ) {
    const email = event.data.customer.email;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (user) {
      user.plan = "pro";
      saveUsers(users);
      console.log("✅ User upgraded to PRO:", email);
    }
  }

  res.send("OK");
});

app.listen(PORT, () =>
  console.log("✅ Server running on port " + PORT)
);
