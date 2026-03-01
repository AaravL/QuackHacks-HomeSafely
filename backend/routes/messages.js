const express = require('express');
const router = express.Router();
const { executeQuery } = require('../services/snowflake');

// GET /api/messages/chat/:userId/:otherUserId
router.get('/chat/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const query = `
      SELECT
        ID,
        SENDER_ID,
        RECIPIENT_ID,
        CONTENT,
        IS_ARCHIVED,
        CREATED_AT,
        TO_VARCHAR(CONVERT_TIMEZONE('UTC', CREATED_AT), 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS CREATED_AT_UTC
      FROM MESSAGES
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

// GET /api/messages/conversations/:userId
// Returns one row per unique conversation partner with the last message time + content
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Snowflake requires the full CASE expression in GROUP BY — aliases not allowed.
    // We also pull in the last message content via a subquery for richer UI display.
    const query = `
      SELECT
        CASE
          WHEN SENDER_ID = ? THEN RECIPIENT_ID
          ELSE SENDER_ID
        END AS OTHER_USER_ID,
        MAX(CREATED_AT) AS LAST_MESSAGE_TIME,
        TO_VARCHAR(CONVERT_TIMEZONE('UTC', MAX(CREATED_AT)), 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS LAST_MESSAGE_TIME_UTC,
        MAX(CONTENT)    AS LAST_MESSAGE_CONTENT
      FROM MESSAGES
      WHERE (SENDER_ID = ? OR RECIPIENT_ID = ?)
        AND IS_ARCHIVED = FALSE
      GROUP BY
        CASE
          WHEN SENDER_ID = ? THEN RECIPIENT_ID
          ELSE SENDER_ID
        END
      ORDER BY LAST_MESSAGE_TIME DESC
    `;

    const conversations = await executeQuery(query, [userId, userId, userId, userId]);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /api/messages
router.post('/', async (req, res) => {
  try {
    const { senderId, recipientId, content } = req.body;

    if (!senderId || !recipientId || !content?.trim()) {
      return res.status(400).json({ error: 'senderId, recipientId, and content are required' });
    }

    const query = `
      INSERT INTO MESSAGES (SENDER_ID, RECIPIENT_ID, CONTENT, IS_ARCHIVED, CREATED_AT)
      VALUES (?, ?, ?, FALSE, CURRENT_TIMESTAMP())
    `;

    await executeQuery(query, [senderId, recipientId, content.trim()]);
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/messages/archive/:userId/:otherUserId
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
    console.error('Error archiving chat:', error);
    res.status(500).json({ error: 'Failed to archive chat' });
  }
});

module.exports = router;