const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const FREE_LIMIT = 3;
const usageFile = path.join(__dirname, "data", "usage.json");

let usage = {};
if (fs.existsSync(usageFile)) {
  usage = JSON.parse(fs.readFileSync(usageFile, "utf8"));
}

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// page
app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});

// API
app.post("/generate", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";

    const today = new Date().toDateString();

    if (!usage[ip] || usage[ip].date !== today) {
      usage[ip] = { count: 0, date: today };
    }

    if (usage[ip].count >= FREE_LIMIT) {
      return res.json({
        success: false,
        limit: true,
        message: "Free limit reached. Upgrade coming soon 🚀"
      });
    }

    usage[ip].count++;
    fs.writeFileSync(usageFile, JSON.stringify(usage, null, 2));

    const { prompt } = req.body;
    if (!prompt) {
      return res.json({ success: false, message: "Prompt required" });
    }

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512"
    });

    res.json({
      success: true,
      image: result.data[0].url,
      remaining: FREE_LIMIT - usage[ip].count
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
