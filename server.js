
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

const USERS = path.join(__dirname, 'data', 'users.json');
const SECRET = 'tele-tech-secret';

// Load users
function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS));
}
// Save users
function saveUsers(u) {
  fs.writeFileSync(USERS, JSON.stringify(u, null, 2));
}

// REGISTER
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Missing username or password' });

  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  users.push({ username, password });
  saveUsers(users);
  res.json({ success: true });
});

// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  const u = users.find(u => u.username === username && u.password === password);
  if (!u) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// GENERATE IMAGE
app.post('/generate', (req, res) => {
  const { token, prompt } = req.body;

  try {
    jwt.verify(token, SECRET);
    // placeholder
    res.json({ image: "https://example.com/generated.png" });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// RUN SERVER
app.listen(3000, () => const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
