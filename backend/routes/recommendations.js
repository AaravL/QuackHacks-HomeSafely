const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../services/gemini');
const { executeQuery } = require('../services/snowflake');

// Get personalized recommendations
router.post('/personalized', async (req, res) => {
  try {
    const { userId, userLocation, userDestination } = req.body;

    // Get all active posts
    const postsQuery = `
      SELECT p.*, u.AGE, u.GENDER
      FROM POSTS p
      JOIN USERS u ON p.USER_ID = u.ID
      WHERE p.IS_ACTIVE = TRUE AND p.USER_ID != ?
    `;

    const posts = await executeQuery(postsQuery, [userId]);

    // Get Gemini recommendations
    const recommendations = await getRecommendations(
      userLocation,
      userDestination,
      posts
    );

    // Update recommendation scores in database
    for (const rec of recommendations) {
      const updateQuery = `
        UPDATE POSTS SET RECOMMENDATION_SCORE = ? WHERE ID = ?
      `;
      await executeQuery(updateQuery, [rec.score, rec.postId]);
    }

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router;