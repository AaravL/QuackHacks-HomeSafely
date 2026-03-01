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
    // Calculate trip distance (from start to end) using haversine formula
    let query = `
      SELECT
        p.*,
        u.NAME,
        u.AGE,
        u.GENDER,
        u.PROFILE_IMAGE,
        3959 * ACOS(
          LEAST(1.0,
            COS(RADIANS(p.START_LAT)) * COS(RADIANS(p.END_LAT)) *
            COS(RADIANS(p.END_LNG) - RADIANS(p.START_LNG)) +
            SIN(RADIANS(p.START_LAT)) * SIN(RADIANS(p.END_LAT))
          )
        ) AS TRIP_DISTANCE
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
    const { userId, startLat, startLng, endLat, endLng, startLocation, destination, mode } = req.body;

    if (!userId || startLat == null || startLng == null || endLat == null || endLng == null || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate coords are actual numbers
    const coords = [startLat, startLng, endLat, endLng].map(Number);
    if (coords.some(isNaN)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Deactivate any existing active posts by this user (one post per user limit)
    await executeQuery(
      'UPDATE POSTS SET IS_ACTIVE = FALSE WHERE USER_ID = ? AND IS_ACTIVE = TRUE',
      [userId]
    );

    // Check if START_LOCATION column exists by trying to use it
    let query, params;
    if (startLocation) {
      // Try with START_LOCATION column (will fail gracefully if column doesn't exist)
      query = `
        INSERT INTO POSTS (
          USER_ID, START_LAT, START_LNG, END_LAT, END_LNG,
          START_LOCATION, DESTINATION, MODE, IS_ACTIVE, CREATED_AT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP())
      `;
      params = [
        userId,
        coords[0],
        coords[1],
        coords[2],
        coords[3],
        startLocation,
        destination,
        mode || 'hybrid',
      ];
    } else {
      query = `
        INSERT INTO POSTS (
          USER_ID, START_LAT, START_LNG, END_LAT, END_LNG,
          DESTINATION, MODE, IS_ACTIVE, CREATED_AT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP())
      `;
      params = [
        userId,
        coords[0],
        coords[1],
        coords[2],
        coords[3],
        destination,
        mode || 'hybrid',
      ];
    }

    let result;
    try {
      result = await executeQuery(query, params);
    } catch (err) {
      // If START_LOCATION column doesn't exist, retry without it
      if (err.message && err.message.includes('START_LOCATION')) {
        console.log('[posts] START_LOCATION column not found, inserting without it');
        query = `
          INSERT INTO POSTS (
            USER_ID, START_LAT, START_LNG, END_LAT, END_LNG,
            DESTINATION, MODE, IS_ACTIVE, CREATED_AT
          ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP())
        `;
        params = [
          userId,
          coords[0],
          coords[1],
          coords[2],
          coords[3],
          destination,
          mode || 'hybrid',
        ];
        result = await executeQuery(query, params);
      } else {
        throw err;
      }
    }

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