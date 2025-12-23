import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   AI CHAT
========================= */
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await aiRes.json();

    if (!data.choices) {
      return res.status(500).json({ error: "OpenAI response error" });
    }

    res.json({
      reply: data.choices[0].message.content
    });
  } catch (err) {
    res.status(500).json({ error: "AI request failed" });
  }
});

/* =========================
   VERIFY PAYMENT (REAL)
========================= */
app.post("/verify-payment", async (req, res) => {
  const { reference } = req.body;

  try {
    const payRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    const data = await payRes.json();

    if (data.status && data.data.status === "success") {
      return res.json({
        success: true,
        plan: "pro",
        expiresIn: "30 days"
      });
    }

    res.status(400).json({ success: false });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("✅ Tele AI Chat running on port", PORT)
);
