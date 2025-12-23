import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// IMAGE GENERATION
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: prompt,
          size: "1024x1024"
        })
      }
    );

    const data = await response.json();

    if (!data.data || !data.data[0]) {
      return res.status(500).json({ error: "Image generation failed" });
    }

    res.json({ image: data.data[0].url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PAYSTACK VERIFY
app.post("/verify-payment", async (req, res) => {
  const { reference } = req.body;

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false });
    }

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running on port 3000");
});
