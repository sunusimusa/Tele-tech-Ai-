// ====== IMPORTS ======
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");

// ====== APP ======
const app = express();
const PORT = process.env.PORT || 10000;

// ====== OPENAI CLIENT ======
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== STATIC FILES ======
app.use(express.static(path.join(__dirname, "public")));

// ====== GET PAGES ======
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});

// ====== POST APIs ======
app.post("/register", async (req, res) => {
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  res.json({ success: true });
});

// ✅ AI IMAGE GENERATION (DAI-DAI)
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ success: false, message: "Prompt is required" });
    }

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512"
    });

    res.json({
      success: true,
      image: result.data[0].url
    });

  } catch (err) {
    console.error("OPENAI ERROR:", err);
    res.json({
      success: false,
      message: "Image generation failed"
    });
  }
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
