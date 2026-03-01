const express = require('express');
const router = express.Router();
const { executeQuery } = require('../services/snowflake');

// Get chat history
router.get('/chat/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const query = `
      SELECT * FROM MESSAGES 
      WHERE (SENDER_ID = ? AND RECIPIENT_ID = ?) 
         OR (SENDER_ID = ? AND RECIPIENT_ID = ?)
      ORDER BY CREATED_AT ASC
    `;

    const messages = await executeQuery(query, [userId, otherUserId, otherUserId, userId]);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get all conversations for user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN SENDER_ID = ? THEN RECIPIENT_ID 
          ELSE SENDER_ID 
        END as OTHER_USER_ID,
        MAX(CREATED_AT) as LAST_MESSAGE_TIME
      FROM MESSAGES 
      WHERE SENDER_ID = ? OR RECIPIENT_ID = ?
      GROUP BY OTHER_USER_ID
      ORDER BY LAST_MESSAGE_TIME DESC
    `;

    const conversations = await executeQuery(query, [userId, userId, userId]);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Send message
router.post('/', async (req, res) => {
  try {
    const { senderId, recipientId, content } = req.body;

    const query = `
      INSERT INTO MESSAGES (SENDER_ID, RECIPIENT_ID, CONTENT, CREATED_AT, IS_ARCHIVED)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP(), FALSE)
    `;

    await executeQuery(query, [senderId, recipientId, content]);
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Archive chat
router.post('/archive/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const query = `
      UPDATE MESSAGES 
      SET IS_ARCHIVED = TRUE
      WHERE (SENDER_ID = ? AND RECIPIENT_ID = ?) 
         OR (SENDER_ID = ? AND RECIPIENT_ID = ?)
    `;

    await executeQuery(query, [userId, otherUserId, otherUserId, userId]);
    res.json({ message: 'Chat archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive chat' });
  }
});

module.exports = router;