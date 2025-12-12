const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const USERS_FILE = "./data/users.json";

// ==== REGISTER ====
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.json({ success: false, message: "Dukkan filayen dole a cike su" });

  let users = [];

  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  }

  const exists = users.find(u => u.email === email);
  if (exists) return res.json({ success: false, message: "Email din yana riga da aka yi amfani da shi" });

  users.push({ username, email, password });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  res.json({ success: true, message: "An yi rijista lafiya" });
});

// ==== LOGIN ====
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.json({ success: false, message: "Email ko password ba daidai bane" });

  res.json({ success: true, message: "An shiga lafiya" });
});

// ==== ROUTES FOR PAGES ====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public/register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.listen(3000, () => console.log("Server running..."));
