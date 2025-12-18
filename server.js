// ===== IMPORTS =====
const express = require("express");
const path = require("path");
const OpenAI = require("openai");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

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
      return res.json({
        success: false,
        reply: "No message received"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful Hausa assistant."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({
      success: true,
      reply
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.json({
      success: false,
      reply: "AI error, please try again later"
    });
  }
});

// ===== FLUTTERWAVE PAYMENT API =====
app.post("/pay", async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({
        error: "Missing email or amount"
      });
    }

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "tele-tech-" + Date.now(),
        amount: amount,
        currency: "NGN",
        redirect_url: "https://tele-tech-ai.onrender.com/success.html",
        customer: {
          email: email
        },
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

    res.json({
      link: response.data.data.link
    });

  } catch (err) {
    console.error("PAYMENT ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: "Payment initialization failed"
    });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
