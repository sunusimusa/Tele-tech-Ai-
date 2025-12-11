// server.js
import express from "express";
import fs from "fs-extra";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OpenAI } from "openai";

dotenv.config();

const PORT = process.env.PORT || 10000;
const DB_FILE = process.env.DB_FILE || "./data/users.json";
const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_CHANGE_ME";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("./")); // serve frontend files at /frontend/*

// ensure data folder/file
await fs.ensureDir(path.dirname(DB_FILE));
if (!(await fs.pathExists(DB_FILE))) {
  await fs.writeJson(DB_FILE, { users: [] }, { spaces: 2 });
}

async function readDb() {
  const j = await fs.readJson(DB_FILE);
  return j.users || [];
}
async function writeDb(users) {
  await fs.writeJson(DB_FILE, { users }, { spaces: 2 });
}

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -- register
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ success: false, message: "username & password required" });

    const users = await readDb();
    if (users.find(u => u.username === username)) return res.json({ success: false, message: "username taken" });

    const hashed = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), username, password: hashed, createdAt: new Date().toISOString() };
    users.push(user);
    await writeDb(users);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token });
  } catch (e) {
    console.error("register err", e);
    return res.status(500).json({ success: false, message: "server error" });
  }
});

// -- login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await readDb();
    const user = users.find(u => u.username === username);
    if (!user) return res.json({ success: false, message: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false, message: "invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token });
  } catch (e) {
    console.error("login err", e);
    return res.status(500).json({ success: false, message: "server error" });
  }
});

// -- protected image generation
app.post("/generate", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "unauthorized" });
    const token = auth.split(" ")[1];
    jwt.verify(token, JWT_SECRET);

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "missing prompt" });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: "OpenAI key not configured" });
    }

    // Image generation using OpenAI images endpoint (SDK may differ)
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    // new SDK often returns response.data[0].b64_json
    const b64 = response.data?.[0]?.b64_json || response.data?.[0]?.b64 || null;
    if (!b64) {
      console.error("image response:", response);
      return res.status(500).json({ success: false, message: "no image returned" });
    }
    const dataUrl = "data:image/png;base64," + b64;
    return res.json({ success: true, image: dataUrl });
  } catch (err) {
    console.error("generate err", err?.response?.data || err.message || err);
    return res.status(500).json({ success: false, message: "generation failed" });
  }
});

// fallback serve index
app.get("/", (req, res) => res.sendFile(path.resolve("./frontend/index.html")));

app.listen(PORT, () => console.log(`Tele Tech AI running on port ${PORT}`));
