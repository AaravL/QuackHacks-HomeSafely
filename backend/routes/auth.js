const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../services/snowflake');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, age, gender, name } = req.body;

    if (!email || !password || !age || !gender || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingQuery = 'SELECT * FROM USERS WHERE EMAIL = ?';
    const existing = await executeQuery(existingQuery, [email]);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into Snowflake
    const insertQuery = `
      INSERT INTO USERS (EMAIL, PASSWORD_HASH, AGE, GENDER, NAME, CREATED_AT)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
    `;

    await executeQuery(insertQuery, [email, hashedPassword, age, gender, name]);

    // Get the newly created user
    const userResults = await executeQuery('SELECT * FROM USERS WHERE EMAIL = ?', [email]);
    
    if (userResults && userResults.length > 0) {
      const newUser = userResults[0];
      const token = jwt.sign(
        { userId: newUser.ID, email: newUser.EMAIL },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: newUser.ID,
          email: newUser.EMAIL,
          name: newUser.NAME,
          age: newUser.AGE,
          gender: newUser.GENDER,
        },
      });
    } else {
      res.status(201).json({ message: 'User registered successfully' });
    }
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

    if (!results || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.ID, email: user.EMAIL },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
