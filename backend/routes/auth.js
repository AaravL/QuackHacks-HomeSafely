const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jwt-decode');
const { executeQuery } = require('../services/snowflake');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, age, gender, name } = req.body;

    if (!email || !password || !age || !gender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into Snowflake
    const query = `
      INSERT INTO USERS (EMAIL, PASSWORD_HASH, AGE, GENDER, NAME, CREATED_AT)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
    `;

    await executeQuery(query, [email, hashedPassword, age, gender, name]);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user from Snowflake
    const query = 'SELECT * FROM USERS WHERE EMAIL = ?';
    const results = await executeQuery(query, [email]);

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token (simplified - use proper JWT in production)
    const token = Buffer.from(JSON.stringify({ userId: user.ID, email: user.EMAIL })).toString('base64');

    res.json({
      token,
      user: {
        id: user.ID,
        email: user.EMAIL,
        name: user.NAME,
        age: user.AGE,
        gender: user.GENDER,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
