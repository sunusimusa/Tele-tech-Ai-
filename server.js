import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ---- OPENAI SETUP ----
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// AI Route
app.post("/api/chat", async (req, res) => {
    try {
        const userMsg = req.body.message;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: userMsg }]
        });

        res.json({ reply: completion.choices[0].message.content });

    } catch (err) {
        res.json({ reply: "Error from AI server." });
    }
});

// Static file for website
app.use(express.static("./"));

app.listen(PORT, () => console.log("Tele Tech AI running on " + PORT));
