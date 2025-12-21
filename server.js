const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= IMAGE GENERATE (POLLINATIONS) ================= */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ error: "Prompt required" });
  }

  // Pollinations image URL
  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt);

  res.json({
    image: imageUrl
  });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
