// ====== IMPORTS ======
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");
// ====== APP ======
const app = express();
const PORT = process.env.PORT || 10000;

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== STATIC FILES ======
app.use(express.static(path.join(__dirname, "public")));

// ====== GET PAGES ======
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});
// ====== POST APIs ======
app.post("/register", async (req, res) => {
  // register logic
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  // login logic
  res.json({ success: true });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
