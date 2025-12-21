const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

/* ================== MEMORY STORE ==================
   (temporary – daga baya za mu koma DB)
================================================== */
const usage = {}; // { ip: count }
const FREE_LIMIT = 3;

/* ================== MIDDLEWARE ================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================== HOME ================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================== GENERATE IMAGE ================== */
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ error: "Prompt required" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  usage[ip] = usage[ip] || 0;

  // ❌ FREE LIMIT REACHED
  if (usage[ip] >= FREE_LIMIT) {
    return res.status(403).json({
      error: "Free limit reached",
      pay: true
    });
  }

  usage[ip] += 1;

  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt);

  res.json({
    success: true,
    image: imageUrl,
    remaining: FREE_LIMIT - usage[ip]
  });
});

/* ================== PAYMENT PLACEHOLDER ================== */
/*
  Nan ne za mu saka:
  - Paystack initialize
  - Flutterwave checkout
*/
app.post("/pay", (req, res) => {
  res.json({
    message: "Payment coming soon",
    amount: 200 // ₦200 example
  });
});
/* ================= WATCH AD (+1 IMAGE) ================= */
app.post("/watch-ad", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // idan free user ne, a bashi extra chance
  if (user.plan === "free") {
    if (user.dailyCount > 0) {
      user.dailyCount -= 1; // +1 image
    }
    saveUsers(users);
  }

  res.json({
    success: true,
    message: "Ad watched. +1 image added"
  });
});
// ===== SIMPLE MEMORY LIMIT (FREE USERS) =====
const freeUsage = {}; 
// example: { ip: { count: 3, date: "2025-09-21" } }

function canGenerate(ip) {
  const today = new Date().toISOString().slice(0, 10);

  if (!freeUsage[ip] || freeUsage[ip].date !== today) {
    freeUsage[ip] = { count: 0, date: today };
  }

  return freeUsage[ip].count < 3; // free = 3 images / day
}

function increaseUsage(ip) {
  freeUsage[ip].count += 1;
}

/* ================== START ================== */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
