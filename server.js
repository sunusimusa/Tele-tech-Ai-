import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* HEALTH CHECK */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* IMAGE GENERATION */
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI key missing" });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `High quality realistic image of: ${prompt}`,
        size: "1024x1024"
      })
    });

    const data = await response.json();

    if (!data.data || !data.data[0]?.url) {
      console.error(data);
      return res.status(500).json({ error: "OpenAI response error" });
    }

    res.json({ image: data.data[0].url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
