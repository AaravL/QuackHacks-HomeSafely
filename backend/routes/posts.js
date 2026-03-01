const express = require('express');
const router = express.Router();
const { executeQuery } = require('../services/snowflake');

// Get posts with sorting
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'recommendation', userId, userLat, userLng } = req.query;
    const lat = userLat ? parseFloat(userLat) : null;
    const lng = userLng ? parseFloat(userLng) : null;

    let query = `
      SELECT 
        p.*,
        u.NAME,
        u.AGE,
        u.GENDER,
        u.PROFILE_IMAGE
    `;

    // Only include distance if coordinates provided
    if (lat !== null && lng !== null) {
      query += `, EARTH_DISTANCE(p.START_LAT, p.START_LNG, ?, ?) as distance`;
    }

    query += `
      FROM POSTS p
      JOIN USERS u ON p.USER_ID = u.ID
      WHERE p.IS_ACTIVE = TRUE
    `;

    // Add sorting
    switch (sortBy) {
      case 'gender':
        query += ' ORDER BY u.GENDER';
        break;
      case 'age':
        query += ' ORDER BY u.AGE';
        break;
      case 'earliest':
        query += ' ORDER BY p.CREATED_AT ASC';
        break;
      case 'closest':
        if (lat !== null && lng !== null) {
          query += ` ORDER BY EARTH_DISTANCE(p.START_LAT, p.START_LNG, ?, ?) ASC`;
        } else {
          query += ' ORDER BY p.RECOMMENDATION_SCORE DESC';
        }
        break;
      case 'recommendation':
      default:
        query += ' ORDER BY p.RECOMMENDATION_SCORE DESC';
    }

    const bindings = (lat !== null && lng !== null) ? [lat, lng] : [];
    const results = await executeQuery(query, bindings);
    res.json(results);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create post
router.post('/', async (req, res) => {
  try {
    const { userId, startLat, startLng, endLat, endLng, destination, mode } = req.body;

    if (!userId || !startLat || !startLng || !endLat || !endLng || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO POSTS (
        USER_ID, START_LAT, START_LNG, END_LAT, END_LNG, 
        DESTINATION, MODE, IS_ACTIVE, CREATED_AT
      ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP())
    `;

    const result = await executeQuery(query, [
      userId,
      startLat,
      startLng,
      endLat,
      endLng,
      destination,
      mode || 'hybrid', // 'uber' or 'walking'
    ]);

    res.status(201).json({ message: 'Post created successfully', result });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete post
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const query = 'UPDATE POSTS SET IS_ACTIVE = FALSE WHERE ID = ?';
    await executeQuery(query, [postId]);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
