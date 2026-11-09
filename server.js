require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "hx8.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  store: new SQLiteStore({ db: "sessions.sqlite", dir: dataDir }),
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
app.use("/api/register", authLimiter);
app.use("/api/login", authLimiter);

const userByEmail = db.prepare("SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ?");
const publicUser = u => ({ id: u.id, username: u.username, email: u.email, role: u.role, createdAt: u.created_at });
const requireAuth = (req, res, next) => req.session.user ? next() : res.status(401).json({ error: "Please log in first." });
const requireAdmin = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: "Please log in first." });
  if (req.session.user.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  next();
};

// Create the first admin from environment variables. Change the password after first login.
(async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (email && password && !userByEmail.get(email)) {
    const hash = await bcrypt.hash(password, 12);
    db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run("HX8 Admin", email, hash);
    console.log("Initial admin account created from environment settings.");
  }
})();

app.post("/api/register", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (username.length < 2 || username.length > 30) return res.status(400).json({ error: "Username must be 2–30 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (password.length < 10) return res.status(400).json({ error: "Password must be at least 10 characters." });
  if (userByEmail.get(email)) return res.status(409).json({ error: "An account with this email already exists." });
  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)").run(username, email, hash);
  const user = { id: Number(result.lastInsertRowid), username, email, role: "user" };
  req.session.user = user;
  res.status(201).json({ user });
});

app.post("/api/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = userByEmail.get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Email or password is incorrect." });
  req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
  res.json({ user: req.session.user });
});

app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/me", (req, res) => res.json({ user: req.session.user || null }));

app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, username, email, role, created_at FROM users ORDER BY id DESC LIMIT 250").all();
  res.json({ users: users.map(publicUser) });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`HX8 portal running at http://localhost:${PORT}`));