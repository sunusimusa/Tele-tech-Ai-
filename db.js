const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "database.sqlite")
);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      plan TEXT DEFAULT 'free',
      verified INTEGER DEFAULT 0,
      dailyCount INTEGER DEFAULT 0,
      lastUsed TEXT
    )
  `);
});

module.exports = db;
