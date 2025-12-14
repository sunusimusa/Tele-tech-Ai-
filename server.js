// ===== IMPORTS =====
const express = require("express");
const path = require("path");
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

// ✅ WANNAN NE AMFANI MAI MUHIMMI
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

// ===== FREE LIMIT CONFIG =====
const FREE_LIMIT = 3;
const usage = {};

// ===== GENERATE IMAGE =====
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";

    if (!prompt) {
      return res.json({
        success: false,
        message: "Prompt is required"
      });
    }

    // init user
    if (!usage[ip]) {
      usage[ip] = { count: 0, date: new Date().toDateString() };
    }

    // reset daily
    if (usage[ip].date !== new Date().toDateString()) {
      usage[ip] = { count: 0, date: new Date().toDateString() };
    }

    // check limit
    if (usage[ip].count >= FREE_LIMIT) {
      return res.json({
        success: false,
        limit: true,
        message: "Free limit reached. Upgrade to Pro 🚀"
      });
    }

    // count +1
    usage[ip].count++;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    return res.json({
      success: true,
      image: result.data[0].url
    });

  } catch (err) {
    console.error("IMAGE ERROR:", err?.error || err);
    return res.json({
      success: false,
      message: "Image generation failed"
    });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
