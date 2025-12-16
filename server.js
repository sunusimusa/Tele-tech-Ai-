// ===== IMPORTS =====
const express = require("express");
const path = require("path");
const fs = require("fs");
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

// ===== SERVE STATIC FILES =====
app.use(express.static(path.join(__dirname, "public")));

// ===== PAGE ROUTES =====
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);

app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "register.html"))
);

app.get("/generator", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "generator.html"))
);

app.get("/pricing", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "pricing.html"))
);

// ===== USERS FILE =====
const usersFile = path.join(__dirname, "data", "users.json");

// ===== LOGIN API =====
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({
      success: false,
      message: "All fields are required"
    });
  }

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  }

  const user = users.find(
    u =>
      (u.username === username || u.email === username) &&
      u.password === password
  );

  if (!user) {
    return res.json({
      success: false,
      message: "Invalid login details"
    });
  }

  return res.json({
    success: true,
    username: user.username,
    plan: user.plan || "free"
  });
});

// ===== IMAGE GENERATION =====
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
      prompt,
      size: "1024x1024"
    });

    res.json({
      success: true,
      image: result.data[0].url
    });

  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.json({
      success: false,
      message: "Image generation failed"
    });
  }
});
// ===== TEXT AI API =====
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({
        success: false,
        message: "Message is required"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Tele Tech AI assistant." },
        { role: "user", content: message }
      ]
    });

    return res.json({
      success: true,
      reply: completion.choices[0].message.content
    });

   } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});
// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
