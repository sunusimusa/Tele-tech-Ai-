import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.static("public"));

/* MEMORY (simple) */
const users = {}; 
// users[ip] = { freeUntil: time, proUntil: time }

/* HEALTH */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* CHAT */
app.post("/chat", async (req, res) => {
  try {
    const ip = req.ip;
    const now = Date.now();

    if (!users[ip]) {
      users[ip] = {
        freeUntil: now + 8 * 60 * 60 * 1000,
        proUntil: 0
      };
    }

    const user = users[ip];
    const isPro = user.proUntil > now;
    const isFree = user.freeUntil > now;

    if (!isPro && !isFree) {
      return res.json({
        error: "Free time ya kare. Don Allah ka upgrade."
      });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await r.json();
    res.json({ reply: data.choices[0].message.content });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error" });
  }
});

/* VERIFY PAYMENT */
app.post("/verify-payment", async (req, res) => {
  const { reference, days } = req.body;
  const ip = req.ip;

  const r = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    }
  );

  const data = await r.json();

  if (data.status && data.data.status === "success") {
    const now = Date.now();
    if (!users[ip]) users[ip] = {};
    users[ip].proUntil = now + days * 24 * 60 * 60 * 1000;

    return res.json({ success: true });
  }

  res.json({ success: false });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on", PORT));
