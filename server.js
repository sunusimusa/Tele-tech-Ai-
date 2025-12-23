import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

/* =========================
   IN-MEMORY USERS (REAL LOGIC)
========================= */
const users = {}; 
// users[email] = { freeUntil, proUntil }

/* =========================
   HELPERS
========================= */
function now() {
  return Date.now();
}

function hours(h) {
  return h * 60 * 60 * 1000;
}

function days(d) {
  return d * 24 * 60 * 60 * 1000;
}

/* =========================
   HEALTH
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   AI CHAT
========================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;
    if (!message || !email) {
      return res.status(400).json({ error: "Missing message or email" });
    }

    // create user if not exists
    if (!users[email]) {
      users[email] = {
        freeUntil: now() + hours(8), // ⏱️ 8 hours free
        proUntil: 0
      };
    }

    const user = users[email];

    const hasAccess =
      now() < user.freeUntil || now() < user.proUntil;

    if (!hasAccess) {
      return res.json({
        error: "Free time expired. Upgrade to PRO."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
});

/* =========================
   PAYSTACK VERIFY (UPGRADE)
========================= */
app.post("/verify-payment", async (req, res) => {
  const { email, reference, plan } = req.body;

  try {
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = await verify.json();

    if (!data.status || data.data.status !== "success") {
      return res.json({ success: false });
    }

    if (!users[email]) {
      users[email] = {
        freeUntil: now() + hours(8),
        proUntil: 0
      };
    }

    if (plan === "1day") users[email].proUntil = now() + days(1);
    if (plan === "2weeks") users[email].proUntil = now() + days(14);
    if (plan === "1month") users[email].proUntil = now() + days(30);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
