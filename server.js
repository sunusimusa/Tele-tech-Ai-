import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.json({ error: "No prompt" });

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
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
    });

    const data = await response.json();
    res.json({ image: data.data[0].url });
  } catch (err) {
    res.json({ error: "Generation failed" });
  }
});

app.listen(3000, () => console.log("Server running"));
