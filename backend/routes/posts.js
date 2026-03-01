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
    const requestingUserId = req.user?.userId; // from auth middleware

    // Get requesting user's profile to apply visibility filters
    let requestingUser = null;
    if (requestingUserId) {
      try {
        const userRows = await executeQuery(
          'SELECT AGE, GENDER, UNIVERSITY FROM USERS WHERE ID = ? LIMIT 1',
          [requestingUserId]
        );
        if (userRows.length > 0) {
          requestingUser = userRows[0];
        }
      } catch (err) {
        console.log('[posts GET] Could not fetch requesting user profile:', err.message);
      }
    }

    const lat = parseFloat(userLat);
    const lng = parseFloat(userLng);
    const hasCoords = !isNaN(lat) && !isNaN(lng);

    // Build SELECT — inline the coords directly (they're numbers, safe to interpolate)
    // Calculate trip distance (from start to end) using haversine formula
    let query = `
      SELECT
        p.*,
        TO_VARCHAR(CONVERT_TIMEZONE('UTC', p.CREATED_AT), 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS CREATED_AT_UTC,
        u.NAME,
        u.AGE,
        u.GENDER,
        u.UNIVERSITY,
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
    let results = await executeQuery(query, []);

    // Apply visibility filtering on the backend
    if (requestingUser) {
      results = results.filter((post) => {
        // Always allow the poster to see their own post
        if (String(post.USER_ID) === String(requestingUserId)) {
          return true;
        }

        const viewerGender = (requestingUser.GENDER || '').toString().trim().toLowerCase();
        const postGender = (post.VISIBLE_TO_GENDER || '').toString().trim().toLowerCase();

        const viewerAge = Number.parseInt(requestingUser.AGE, 10);
        const minAgeRaw = post.VISIBLE_TO_AGE_MIN;
        const maxAgeRaw = post.VISIBLE_TO_AGE_MAX;
        const minAge = minAgeRaw == null ? null : Number.parseInt(minAgeRaw, 10);
        const maxAge = maxAgeRaw == null ? null : Number.parseInt(maxAgeRaw, 10);

        const viewerUniversity = (requestingUser.UNIVERSITY || '').toString().trim().toLowerCase();
        const posterUniversity = (post.UNIVERSITY || '').toString().trim().toLowerCase();
        const postUniversityRule = (post.VISIBLE_TO_UNIVERSITY || '').toString().trim().toLowerCase();

        // Gender filter
        if (postGender && postGender !== 'all' && viewerGender !== postGender) {
          return false;
        }

        // Age range filter
        const hasAgeRule = Number.isFinite(minAge) || Number.isFinite(maxAge);
        if (hasAgeRule && !Number.isFinite(viewerAge)) {
          return false;
        }
        if (Number.isFinite(minAge) && viewerAge < minAge) {
          return false;
        }
        if (Number.isFinite(maxAge) && viewerAge > maxAge) {
          return false;
        }

        // University filter
        if (postUniversityRule && postUniversityRule !== 'all') {
          if (!viewerUniversity) {
            return false;
          }
          if (postUniversityRule === 'same') {
            if (!posterUniversity || viewerUniversity !== posterUniversity) {
              return false;
            }
          } else if (viewerUniversity !== postUniversityRule) {
            return false;
          }
        }

        return true;
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/posts
router.post('/', async (req, res) => {
  try {
    const { 
      userId, startLat, startLng, endLat, endLng, startLocation, destination, mode,
      visibleToGender, visibleToAgeMin, visibleToAgeMax, visibleToUniversity 
    } = req.body;

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

    // Try inserting with all columns including visibility filters
    let query = `
      INSERT INTO POSTS (
        USER_ID, START_LAT, START_LNG, END_LAT, END_LNG,
        ${startLocation ? 'START_LOCATION,' : ''}
        DESTINATION, MODE, IS_ACTIVE,
        VISIBLE_TO_GENDER, VISIBLE_TO_AGE_MIN, VISIBLE_TO_AGE_MAX, VISIBLE_TO_UNIVERSITY,
        CREATED_AT
      ) VALUES (?, ?, ?, ?, ?, ${startLocation ? '?,' : ''} ?, ?, TRUE, ?, ?, ?, ?, CURRENT_TIMESTAMP())
    `;
    
    let params = [
      userId,
      coords[0],
      coords[1],
      coords[2],
      coords[3],
    ];
    
    if (startLocation) {
      params.push(startLocation);
    }
    
    params.push(
      destination,
      mode || 'hybrid',
      visibleToGender || null,
      visibleToAgeMin || null,
      visibleToAgeMax || null,
      visibleToUniversity || null
    );

    let result;
    try {
      result = await executeQuery(query, params);
    } catch (err) {
      // If visibility columns don't exist, retry without them
      if (err.message && (err.message.includes('VISIBLE_TO_') || err.message.includes('invalid identifier'))) {
        console.log('[posts] Visibility filter columns not found, inserting without them');
        
        query = `
          INSERT INTO POSTS (
            USER_ID, START_LAT, START_LNG, END_LAT, END_LNG,
            ${startLocation ? 'START_LOCATION,' : ''}
            DESTINATION, MODE, IS_ACTIVE, CREATED_AT
          ) VALUES (?, ?, ?, ?, ?, ${startLocation ? '?,' : ''} ?, ?, TRUE, CURRENT_TIMESTAMP())
        `;
        
        params = [
          userId,
          coords[0],
          coords[1],
          coords[2],
          coords[3],
        ];
        
        if (startLocation) {
          params.push(startLocation);
        }
        
        params.push(
          destination,
          mode || 'hybrid'
        );
        
        result = await executeQuery(query, params);
      } else if (err.message && err.message.includes('START_LOCATION')) {
        // If START_LOCATION column doesn't exist, retry without it
        console.log('[posts] START_LOCATION column not found, inserting without it');
        query = `
          INSERT INTO POSTS (
            USER_ID, START_LAT, START_LNG, END_LAT, END_LNG,
            DESTINATION, MODE, IS_ACTIVE,
            VISIBLE_TO_GENDER, VISIBLE_TO_AGE_MIN, VISIBLE_TO_AGE_MAX, VISIBLE_TO_UNIVERSITY,
            CREATED_AT
          ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, CURRENT_TIMESTAMP())
        `;
        params = [
          userId,
          coords[0],
          coords[1],
          coords[2],
          coords[3],
          destination,
          mode || 'hybrid',
          visibleToGender || null,
          visibleToAgeMin || null,
          visibleToAgeMax || null,
          visibleToUniversity || null
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