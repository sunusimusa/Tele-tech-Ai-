const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== FREE LIMIT CONFIG =====
const FREE_LIMIT = 3;
const usageFile = path.join(__dirname, "data", "usage.json");

let usage = {};
if (fs.existsSync(usageFile)) {
  usage = JSON.parse(fs.readFileSync(usageFile, "utf8"));
}

// ===== IMAGE GENERATE =====
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";

    if (!prompt) {
      return res.json({ success: false, message: "Prompt required" });
    }

    // init user
    if (!usage[ip]) {
      usage[ip] = { count: 0, date: new Date().toDateString() };
    }

    // reset daily
    if (usage[ip].date !== new Date().toDateString()) {
      usage[ip] = { count: 0, date: new Date().toDateString() };
    }

    // limit check
    if (usage[ip].count >= FREE_LIMIT) {
      return res.json({
        success: false,
        limit: true,
        message: "Free limit reached. Upgrade coming soon 🚀"
      });
    }

    // generate image
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size: "1024x1024"
    });

    usage[ip].count++;
    fs.writeFileSync(usageFile, JSON.stringify(usage, null, 2));

    res.json({
      success: true,
      image: result.data[0].url,
      remaining: FREE_LIMIT - usage[ip].count
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Generation failed" });
  }
});

// ===== PAGE ROUTES =====
app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});
app.get("/pricing", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pricing.html"));
});

app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
