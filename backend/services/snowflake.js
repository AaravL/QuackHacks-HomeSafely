// backend/services/snowflake.js
const path = require("path");
const dotenv = require("dotenv");
const snowflake = require("snowflake-sdk");

// Always load backend/.env regardless of where node is started from
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Validate env early with a clear error (instead of Snowflake MissingParameterError)
const required = [
  "SNOWFLAKE_ACCOUNT",
  "SNOWFLAKE_USER",
  "SNOWFLAKE_PASSWORD",
  "SNOWFLAKE_WAREHOUSE",
  "SNOWFLAKE_DATABASE",
  "SNOWFLAKE_SCHEMA",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(
    `Missing required env vars: ${missing.join(", ")}. Check backend/.env`
  );
}

// IMPORTANT: snowflake-sdk expects "username" (not "user") in many versions.
// Using username here avoids the "A user name must be specified" error.
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
});

// Connect once and reuse (prevents multiple listeners / repeated connects)
let connectPromise = null;

function connectToSnowflake() {
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        connectPromise = null; // allow retry
        console.error("Unable to connect to Snowflake:", err.message);
        reject(err);
      } else {
        console.log("Successfully connected to Snowflake");
        resolve(conn);
      }
    });
  });

  return connectPromise;
}

async function executeQuery(sqlText, binds = []) {
  // Ensure we are connected before executing
  await connectToSnowflake();

  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error("Error executing query:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      },
    });
  });
}

module.exports = {
  connectToSnowflake,
  executeQuery,
  connection,
};