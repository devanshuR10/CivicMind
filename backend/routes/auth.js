const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new citizen account
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = await db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'CITIZEN', ?)
    `).run(name.trim(), email.toLowerCase().trim(), password_hash, phone || null);

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ id: userId, role: "CITIZEN", email: email.toLowerCase().trim() }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Citizen account registered successfully.",
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: "CITIZEN",
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
});

/**
 * POST /api/auth/login
 * User authentication endpoint
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error during login." });
  }
});

/**
 * GET /api/auth/me
 * Get active authenticated user details
 */
router.get("/me", authenticateToken, async (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
