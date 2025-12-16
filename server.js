// ===== IMPORTS =====
const express = require("express");
const path = require("path");
const fs = require("fs"); // ✅ WANNAN YA KASANCE
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

// ===== OPENAI =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== MIDDLEWARES =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SERVE PUBLIC FILES
app.use(express.static(path.join(__dirname, "public")));

// ===== PAGE ROUTES =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});

app.get("/pricing", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pricing.html"));
});

// ===== FREE LIMIT (zamu yi amfani da shi daga baya) =====
const FREE_LIMIT = 3;
const usage = {};

// ===== GENERATE IMAGE API =====
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({
        success: false,
        message: "Prompt is required"
      });
    }

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024"
    });

    return res.json({
      success: true,
      image: result.data[0].url
    });

  } catch (err) {
    console.error("IMAGE ERROR:", err);

    return res.json({
      success: false,
      message: err?.error?.message || "Image generation failed"
    });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
