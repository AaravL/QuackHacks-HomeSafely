const express = require('express');
const router = express.Router();
const { executeQuery } = require('../services/snowflake');

// Haversine distance expression in miles (pure SQL, no UDF needed)
function haversine(lat, lng) {
  return `
    3959 * ACOS(
      LEAST(1.0,
        COS(RADIANS(${lat})) * COS(RADIANS(p.START_LAT)) *
        COS(RADIANS(p.START_LNG) - RADIANS(${lng})) +
        SIN(RADIANS(${lat})) * SIN(RADIANS(p.START_LAT))
      )
    )
  `;
}

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'recommendation', userLat, userLng } = req.query;

    const lat = parseFloat(userLat);
    const lng = parseFloat(userLng);
    const hasCoords = !isNaN(lat) && !isNaN(lng);

    // Build SELECT — inline the coords directly (they're numbers, safe to interpolate)
    let query = `
      SELECT
        p.*,
        u.NAME,
        u.AGE,
        u.GENDER,
        u.PROFILE_IMAGE
        ${hasCoords ? `, ${haversine(lat, lng)} AS DISTANCE` : ''}
      FROM POSTS p
      JOIN USERS u ON p.USER_ID = u.ID
      WHERE p.IS_ACTIVE = TRUE
    `;

    // Build ORDER BY
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
        // Fall back to recommendation score if no coords supplied
        query += hasCoords
          ? ` ORDER BY ${haversine(lat, lng)} ASC`
          : ' ORDER BY p.RECOMMENDATION_SCORE DESC';
        break;
      case 'recommendation':
      default:
        query += ' ORDER BY p.RECOMMENDATION_SCORE DESC';
    }

    // No bindings needed — lat/lng are interpolated as validated numbers
    const results = await executeQuery(query, []);
    res.json(results);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/posts
router.post('/', async (req, res) => {
  try {
    const { userId, startLat, startLng, endLat, endLng, destination, mode } = req.body;

    if (!userId || startLat == null || startLng == null || endLat == null || endLng == null || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate coords are actual numbers
    const coords = [startLat, startLng, endLat, endLng].map(Number);
    if (coords.some(isNaN)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const query = `
      INSERT INTO POSTS (
        USER_ID, START_LAT, START_LNG, END_LAT, END_LNG,
        DESTINATION, MODE, IS_ACTIVE, CREATED_AT
      ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP())
    `;

    const result = await executeQuery(query, [
      userId,
      coords[0],
      coords[1],
      coords[2],
      coords[3],
      destination,
      mode || 'hybrid',
    ]);

    res.status(201).json({ message: 'Post created successfully', result });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// DELETE /api/posts/:postId  (soft delete)
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    await executeQuery('UPDATE POSTS SET IS_ACTIVE = FALSE WHERE ID = ?', [postId]);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;