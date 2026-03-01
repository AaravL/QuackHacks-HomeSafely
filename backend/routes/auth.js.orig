// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { executeQuery } = require("../services/snowflake");

const router = express.Router();

// Optional: enforce Stevens email
function isAllowedEmail(email) {
  return typeof email === "string" && email.toLowerCase().endsWith("@stevens.edu");
}

/**
 * POST /api/auth/register
 * Creates an auth account (email + password) + basic profile fields
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, age, gender, account, username, university } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    // Uncomment if you want Stevens-only
    // if (!isAllowedEmail(email)) return res.status(403).json({ error: "Stevens email required" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not set" });
    }

    // Check existing
    const existing = await executeQuery(
      `SELECT ID FROM USERS WHERE EMAIL = ? LIMIT 1`,
      [email]
    );
    if (existing.length) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    // NOTE: This assumes your USERS table has these columns.
    // If your table does NOT include ACCOUNT/USERNAME/UNIVERSITY/NAME, tell me and I’ll align it.
    await executeQuery(
      `INSERT INTO USERS (EMAIL, PASSWORD_HASH, NAME, ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY, CREATED_AT, UPDATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`,
      [
        email,
        passwordHash,
        name ?? null,
        account ?? null,
        username ?? null,
        age ?? null,
        gender ?? null,
        university ?? null,
      ]
    );

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed", detail: error.message });
  }
});

/**
 * POST /api/auth/login
 * Returns a signed JWT
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not set" });
    }

    const rows = await executeQuery(
      `SELECT ID, EMAIL, PASSWORD_HASH, NAME, ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY
       FROM USERS
       WHERE EMAIL = ?
       LIMIT 1`,
      [email]
    );

    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.ID, email: user.EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.ID,
        email: user.EMAIL,
        name: user.NAME,
        account: user.ACCOUNT,
        username: user.USERNAME,
        age: user.AGE,
        gender: user.GENDER,
        university: user.UNIVERSITY,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed", detail: error.message });
  }
});

module.exports = router;