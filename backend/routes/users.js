const express = require("express");
const router = express.Router();
const { executeQuery } = require("../services/snowflake");


router.post("/", async (req, res) => {
  try {
    const { email, account, username, age, gender, university } = req.body;

    await executeQuery(
      `INSERT INTO USERS (EMAIL, ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        email ?? null,
        account ?? null,
        username ?? null,
        age ?? null,
        gender ?? null,
        university ?? null,
      ]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});




/**
 * Get current authenticated user (must come before /:userId)
 */
router.get("/me", async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const results = await executeQuery(
      `SELECT ID, EMAIL, NAME, ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY,
              IS_ONLINE, LAST_SEEN, TRIPS_COMPLETED, CREATED_AT
       FROM USERS WHERE ID = ? LIMIT 1`,
      [userId]
    );

    if (!results.length) return res.status(404).json({ error: "User not found" });
    res.json({
      ...results[0],
      tripsCompleted: results[0].TRIPS_COMPLETED || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


/**
 * GET /api/users/lookup?limit=5
 * Returns the most recently created users (useful for testing)
 */
router.get("/lookup", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const results = await executeQuery(
      `SELECT ID, USERNAME, ACCOUNT, EMAIL, CREATED_AT
       FROM USERS
       ORDER BY CREATED_AT DESC
       LIMIT ?`,
      [limit]
    );

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to lookup users" });
  }
});


/**
 * Get user profile
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT ID, NAME, ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY,
             IS_ONLINE, LAST_SEEN, TRIPS_COMPLETED, CREATED_AT
      FROM USERS
      WHERE ID = ?
      LIMIT 1
    `;

    const results = await executeQuery(query, [userId]);

    if (!results.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ...results[0],
      tripsCompleted: results[0].TRIPS_COMPLETED || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * Update user profile fields
 */
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { account, username, age, gender, university } = req.body;

    const updateQuery = `
      UPDATE USERS
      SET
        ACCOUNT = COALESCE(?, ACCOUNT),
        USERNAME = COALESCE(?, USERNAME),
        AGE = COALESCE(?, AGE),
        GENDER = COALESCE(?, GENDER),
        UNIVERSITY = COALESCE(?, UNIVERSITY),
        UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE ID = ?
    `;

    await executeQuery(updateQuery, [
      account ?? null,
      username ?? null,
      age ?? null,
      gender ?? null,
      university ?? null,
      userId,
    ]);

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * Update user online status
 */
router.put("/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    const query = `
      UPDATE USERS
      SET
        IS_ONLINE = ?,
        LAST_SEEN = CURRENT_TIMESTAMP()
      WHERE ID = ?
    `;

    await executeQuery(query, [isOnline, userId]);

    res.json({ message: "Status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update status" });
  }
});


// One important thing — this route **must be added before** `router.get("/:userId")` in the file, otherwise Express will intercept `/lookup` and treat `"lookup"` as a userId, giving you a 404. The `/me` route we added earlier has the same requirement, so the order in your file should be:

// GET /me
// GET /lookup  
// GET /:userId

module.exports = router;