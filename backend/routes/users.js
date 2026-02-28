const express = require("express");
const router = express.Router();
const { executeQuery } = require("../services/snowflake");

/**
 * Create user profile
 */
router.post("/", async (req, res) => {
  try {
    const { account, username, age, gender, university } = req.body;

    if (!account || !username) {
      return res.status(400).json({ error: "account and username are required" });
    }

    const insertQuery = `
      INSERT INTO USERS (ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY)
      VALUES (?, ?, ?, ?, ?)
    `;

    const { randomUUID } = require("crypto");
    const id = randomUUID();

    await executeQuery(
      `INSERT INTO USERS (ID, ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, account, username, age ?? null, gender ?? null, university ?? null]
    );

    res.json({ message: "User created successfully", id });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
      }
});




/**
 * Get user profile
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT ID, ACCOUNT, USERNAME, AGE, GENDER, UNIVERSITY,
             IS_ONLINE, LAST_SEEN, CREATED_AT
      FROM USERS
      WHERE ID = ?
      LIMIT 1
    `;

    const results = await executeQuery(query, [userId]);

    if (!results.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(results[0]);
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

module.exports = router;