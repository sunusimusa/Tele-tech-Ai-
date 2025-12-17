const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== CHAT API ===== */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({ success: false, reply: "No message received" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful Hausa assistant." },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({
      success: true,
      reply: reply
    });

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      reply: "AI error"
    });
  }
});
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
