const express = require('express');
const router = express.Router();
const { executeQuery } = require('../services/snowflake');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = 'SELECT * FROM USERS WHERE ID = ?';
    const results = await executeQuery(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user status (online/offline)
router.put('/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    const query = 'UPDATE USERS SET IS_ONLINE = ?, LAST_SEEN = CURRENT_TIMESTAMP() WHERE ID = ?';
    await executeQuery(query, [isOnline, userId]);

    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
