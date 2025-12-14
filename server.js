// ====== FREE LIMIT CONFIG ======
const FREE_LIMIT = 3;

// memory store (simple for now)
const usage = {};
// ===== IMPORTS =====
const express = require("express");
const cors = require("cors");
const path = require("path");

// ===== APP =====
const app = express();
const PORT = process.env.PORT || 10000;

// ===== MIDDLEWARES (MUHIMMI) =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, "public")));

// ===== GET PAGES =====
app.get("/", (req, res) => {
  res.redirect("/generator");
});

app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});

// ===== IMAGE GENERATION (FREE API VERSION) =====
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ success: false, message: "Prompt required" });
    }

    // FREE IMAGE API (Pollinations)
    const imageUrl =
      "https://image.pollinations.ai/prompt/" +
      encodeURIComponent(prompt);

    res.json({
      success: true,
      image: imageUrl
    });

  } catch (err) {
    console.error("GEN ERROR:", err.message);
    res.json({ success: false });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
