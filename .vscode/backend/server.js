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
  password: "Shiv@38",
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

// =====================
// Kolkata Quiz Endpoints
// =====================

// Get all Kolkata questions (no correct answers sent to frontend)
app.get("/kolkata/questions", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, question, option_a, option_b, option_c, option_d FROM kolkata_quiz");
    res.json({ success: true, questions: rows });
  } catch (error) {
    console.error("Error fetching Kolkata questions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch questions" });
  }
});

// Check Kolkata answer
app.post("/kolkata/check-answer", async (req, res) => {
  try {
    const { id, selectedOption } = req.body;
    if (!id || !selectedOption) {
      return res.status(400).json({ success: false, error: "Missing question ID or selected option" });
    }

    // Fetch all options AND correct_option
    const [rows] = await pool.query("SELECT * FROM kolkata_quiz WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }

    const question = rows[0];
    const isCorrect = question.correct_option === selectedOption;

    if (isCorrect) {
      res.json({ success: true, correct: true });
    } else {
      // get the correct answer text dynamically
      const correctAnswerKey = `option_${question.correct_option.toLowerCase()}`;
      const correctAnswerText = question[correctAnswerKey];

      res.json({ success: true, correct: false, correctAnswerText });
    }
  } catch (error) {
    console.error("Error checking answer:", error);
    res.status(500).json({ success: false, error: "Failed to check answer" });
  }
});

//HISTORY SECTION

// Fetch all history questions (you can randomize or limit if you like)
app.get("/history/questions", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, question, option_a, option_b, option_c, option_d FROM history_quiz ORDER BY id ASC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching history questions:", error);
    res.status(500).json({ error: "Failed to fetch history questions" });
  }
});

// Check answer for history module
app.post("/history/check-answer", async (req, res) => {
  try {
    const { id, selectedOption } = req.body;
    if (!id || !selectedOption) {
      return res.status(400).json({ success: false, error: "Missing question ID or selected option" });
    }

    const [rows] = await pool.query("SELECT * FROM history_quiz WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }

    const question = rows[0];
    const isCorrect = question.correct_option === selectedOption;

    if (isCorrect) {
      res.json({ success: true, correct: true });
    } else {
      const correctAnswerKey = `option_${question.correct_option.toLowerCase()}`;
      const correctAnswerText = question[correctAnswerKey];
      res.json({ success: true, correct: false, correctAnswerText });
    }
  } catch (error) {
    console.error("Error checking answer:", error);
    res.status(500).json({ success: false, error: "Failed to check answer" });
  }
});

// ------------------- NIRBHAYA MODULE -------------------

// Fetch all Nirbhaya questions
app.get("/nirbhaya/questions", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, question_text, option_a, option_b, option_c, option_d FROM nirbhaya_quiz ORDER BY id ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Nirbhaya questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Check answer for Nirbhaya
app.post("/nirbhaya/check-answer", async (req, res) => {
  try {
    const { id, selectedOption } = req.body;
    if (!id || !selectedOption)
      return res.status(400).json({ success: false, error: "Missing question ID or selected option" });

    const [rows] = await pool.query("SELECT * FROM nirbhaya_quiz WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, error: "Question not found" });

    const question = rows[0];
    const isCorrect = question.correct_answer === selectedOption;
    if (isCorrect) {
  res.json({ success: true, correct: true, explanation: question.explanation });
} else {
  const correctAnswerKey = `option_${question.correct_answer.toLowerCase()}`;
  const correctAnswerText = question[correctAnswerKey];
  res.json({
    success: true,
    correct: false,
    correctAnswerText,
    explanation: question.explanation,
  });
}

  } catch (error) {
    console.error("Error checking answer:", error);
    res.status(500).json({ success: false, error: "Failed to check answer" });
  }
});

// ------------------- LEARN MODULE -------------------

// Enhanced backend APIs for learn module
app.get("/learn/questions/:level", async (req, res) => {
    try {
        const level = req.params.level;
        
        // Validate level parameter
        if (!['1', '2', '3', '4', '5'].includes(level)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid level. Must be between 1-5.' 
            });
        }

        const [rows] = await pool.query(
            `SELECT id, question_text, option_a, option_b, option_c, option_d, explanation 
             FROM learn_level${level}_quiz 
             ORDER BY RAND() LIMIT 5`
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No questions found for this level.' 
            });
        }

        res.json({
            success: true,
            questions: rows
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post("/learn/check-answer/:level", async (req, res) => {
    try {
        const { questionId, selectedOption } = req.body;
        const level = req.params.level;

        if (!questionId || !selectedOption) {
            return res.status(400).json({ 
                success: false, 
                message: 'Question ID and selected option are required.' 
            });
        }

        const [rows] = await pool.query(
            `SELECT correct_answer, option_a, option_b, option_c, option_d, explanation 
             FROM learn_level${level}_quiz 
             WHERE id = ?`, 
            [questionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found.' 
            });
        }

        const question = rows[0];
        const isCorrect = question.correct_answer.toLowerCase() === selectedOption.toLowerCase();
        
        // Get the correct answer text
        const correctAnswerKey = `option_${question.correct_answer.toLowerCase()}`;
        const correctAnswerText = question[correctAnswerKey];

        res.json({
            success: true,
            correct: isCorrect,
            correctAnswer: question.correct_answer,
            correctAnswerText: correctAnswerText,
            explanation: question.explanation
        });
    } catch (error) {
        console.error('Error checking answer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// New API to submit entire quiz and calculate score
app.post("/learn/submit-quiz/:level", async (req, res) => {
    try {
        const { answers } = req.body; // Array of { questionId, selectedOption }
        const level = req.params.level;

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Answers array is required.' 
            });
        }

        let correctCount = 0;
        const results = [];

        for (const answer of answers) {
            const [rows] = await pool.query(
                `SELECT correct_answer, explanation 
                 FROM learn_level${level}_quiz 
                 WHERE id = ?`, 
                [answer.questionId]
            );

            if (rows.length > 0) {
                const question = rows[0];
                const isCorrect = question.correct_answer.toLowerCase() === answer.selectedOption.toLowerCase();
                
                if (isCorrect) correctCount++;

                results.push({
                    questionId: answer.questionId,
                    correct: isCorrect,
                    correctAnswer: question.correct_answer,
                    explanation: question.explanation
                });
            }
        }

        const percentageScore = (correctCount / answers.length) * 100;

        res.json({
            success: true,
            score: correctCount,
            total: answers.length,
            percentage: percentageScore,
            results: results
        });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});


// ------------------- SPIN WHEEL MODULE -------------------
// Spin Wheel APIs
app.get("/spin-wheel/topics", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DISTINCT topic FROM spin_wheel_questions ORDER BY topic"
        );
        
        const topics = rows.map(row => row.topic);
        res.json({
            success: true,
            topics: topics
        });
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.get("/spin-wheel/questions/:topic", async (req, res) => {
    try {
        const topic = req.params.topic;
        
        const [rows] = await pool.query(
            `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation 
             FROM spin_wheel_questions 
             WHERE topic = ? 
             ORDER BY RAND() LIMIT 3`,
            [topic]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No questions found for this topic.' 
            });
        }

        res.json({
            success: true,
            questions: rows
        });
    } catch (error) {
        console.error('Error fetching spin wheel questions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post("/spin-wheel/check-answer", async (req, res) => {
    try {
        const { questionId, selectedOption } = req.body;

        if (!questionId || !selectedOption) {
            return res.status(400).json({ 
                success: false, 
                message: 'Question ID and selected option are required.' 
            });
        }

        const [rows] = await pool.query(
            `SELECT correct_answer, explanation 
             FROM spin_wheel_questions 
             WHERE id = ?`, 
            [questionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found.' 
            });
        }

        const question = rows[0];
        const isCorrect = question.correct_answer.toLowerCase() === selectedOption.toLowerCase();

        res.json({
            success: true,
            correct: isCorrect,
            correctAnswer: question.correct_answer,
            explanation: question.explanation
        });
    } catch (error) {
        console.error('Error checking answer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ------------------- AMENDMENT GAME MODULE -------------------

// Amendment Match Game APIs
app.get("/amendments/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, amendment_number, amendment_title, short_description, 
                    full_description, impact, year 
             FROM amendments 
             ORDER BY year`
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No amendments found.' 
            });
        }

        res.json({
            success: true,
            amendments: rows
        });
    } catch (error) {
        console.error('Error fetching amendments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.get("/amendments/game-data", async (req, res) => {
    try {
        // Get 4 random amendments for the game
        const [rows] = await pool.query(
            `SELECT id, amendment_number, amendment_title, short_description, 
                    full_description, impact, year 
             FROM amendments 
             ORDER BY RAND() LIMIT 4`
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No amendments found for the game.' 
            });
        }

        res.json({
            success: true,
            amendments: rows
        });
    } catch (error) {
        console.error('Error fetching game amendments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ------------------- PREAMBLE QUIZ MODULE -------------------

// Preamble Quiz APIs
app.get("/preamble/questions", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, question_text, option_a, option_b, option_c, option_d, 
                    correct_answer, explanation 
             FROM preamble_questions 
             ORDER BY RAND() LIMIT 5`
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No questions found.' 
            });
        }

        res.json({
            success: true,
            questions: rows
        });
    } catch (error) {
        console.error('Error fetching preamble questions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.get("/preamble/cards", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT card_title, card_content, card_type 
             FROM preamble_cards 
             ORDER BY id`
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No cards found.' 
            });
        }

        res.json({
            success: true,
            cards: rows
        });
    } catch (error) {
        console.error('Error fetching preamble cards:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post("/preamble/check-answer", async (req, res) => {
    try {
        const { questionId, selectedOption } = req.body;

        if (!questionId || !selectedOption) {
            return res.status(400).json({ 
                success: false, 
                message: 'Question ID and selected option are required.' 
            });
        }

        const [rows] = await pool.query(
            `SELECT correct_answer, explanation 
             FROM preamble_questions 
             WHERE id = ?`, 
            [questionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found.' 
            });
        }

        const question = rows[0];
        const isCorrect = question.correct_answer.toLowerCase() === selectedOption.toLowerCase();

        res.json({
            success: true,
            correct: isCorrect,
            correctAnswer: question.correct_answer,
            explanation: question.explanation
        });
    } catch (error) {
        console.error('Error checking answer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post("/preamble/save-score", async (req, res) => {
    try {
        const { userId, score, totalQuestions } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO preamble_scores (user_id, score, total_questions, completed_at) 
             VALUES (?, ?, ?, NOW())`,
            [userId, score, totalQuestions]
        );

        res.json({
            success: true,
            message: 'Score saved successfully',
            scoreId: result.insertId
        });
    } catch (error) {
        console.error('Error saving preamble score:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));