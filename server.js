import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// TEST ROUTE (don tabbatar server yana aiki)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!OPENAI_KEY) {
      return res.status(500).json({ error: "OpenAI API key not set" });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `High quality realistic image of: ${prompt}`,
        size: "1024x1024"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({
        error: "OpenAI request failed",
        details: data
      });
    }

    if (!data?.data?.[0]?.url) {
      return res.status(500).json({ error: "No image returned" });
    }

    res.json({
      image: data.data[0].url
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
