require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// Database connectionn
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "venky",
  database: "samvidhan",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const SECRET_KEY = process.env.JWT_SECRET || 'your-very-strong-secret-key-at-least-32-chars-long';

// Signup endpoint
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [userExists] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ?", 
      [username, email]
    );

    if (userExists.length > 0) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Profile endpoint
app.get("/profile/:userId", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [user] = await pool.query("SELECT id, username, email FROM users WHERE id = ?", [userId]);
    if (user.length === 0) return res.status(404).json({ error: "User not found" });

    const [scores] = await pool.query(
      "SELECT game_type, score FROM game_scores WHERE user_id = ?", 
      [userId]
    );

    const [progress] = await pool.query(
      "SELECT section, progress FROM learning_progress WHERE user_id = ?",
      [userId]
    );

    res.json({
      ...user[0],
      game_scores: scores,
      learning_progress: progress,
      total_score: scores.reduce((sum, game) => sum + game.score, 0)
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Save score endpoint
app.post("/score", authenticateToken, async (req, res) => {
  try {
    const { userId, gameType, score } = req.body;
    
    await pool.query(
      `INSERT INTO game_scores (user_id, game_type, score)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score)`,
      [userId, gameType, score]
    );

    res.json({ message: "Score saved successfully" });
  } catch (error) {
    console.error("Save score error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Save progress endpoint
app.post("/progress", authenticateToken, async (req, res) => {
  try {
    const { userId, section, progress } = req.body;
    
    await pool.query(
      `INSERT INTO learning_progress (user_id, section, progress)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE progress = VALUES(progress)`,
      [userId, section, progress]
    );

    res.json({ message: "Progress saved successfully" });
  } catch (error) {
    console.error("Save progress error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(5000, () => console.log("Server running on port 5000"));