const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// IMAGE GENERATE (Pollinations – FREE)
app.post("/generate", (req, res) => {
  const { prompt } = req.body;
  const ip = req.ip;

  if (!prompt) {
    return res.json({ error: "Prompt required" });
  }

  if (!canGenerate(ip)) {
    return res.json({
      limit: true,
      message: "Free limit reached. Watch ad or upgrade."
    });
  }

  increaseCount(ip);

  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt);

  res.json({ image: imageUrl });
});
// ================= LIMIT (IN-MEMORY) =================
let dailyViews = {}; // IP based

function canGenerate(ip) {
  if (!dailyViews[ip]) {
    dailyViews[ip] = { count: 0, date: new Date().toDateString() };
  }

  // reset daily
  if (dailyViews[ip].date !== new Date().toDateString()) {
    dailyViews[ip] = { count: 0, date: new Date().toDateString() };
  }

  return dailyViews[ip].count < 3; // FREE = 3 images
}

function increaseCount(ip) {
  dailyViews[ip].count++;
}
// ================= AD WATCH =================
app.post("/watch-ad", (req, res) => {
  const ip = req.ip;

  // allow 1 extra image after ad
  if (dailyViews[ip]) {
    dailyViews[ip].count = Math.max(
      dailyViews[ip].count - 1,
      0
    );
  }

  res.json({ success: true });
});
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
