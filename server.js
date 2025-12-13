// ====== IMPORTS ======
const express = require("express");
const cors = require("cors");
const path = require("path");

// ====== APP ======
const app = express();
const PORT = process.env.PORT || 10000;

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== STATIC FILES ======
app.use(express.static(path.join(__dirname, "public")));

// ====== PAGES ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
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

// ====== FREE IMAGE GENERATOR (NO API KEY) ======
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ success: false, message: "Prompt required" });
  }

  // Unsplash random image
  const imageUrl =
    "https://source.unsplash.com/512x512/?" +
    encodeURIComponent(prompt);

  res.json({
    success: true,
    image: imageUrl
  });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
