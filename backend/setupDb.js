const { executeQuery } = require("./services/snowflake");
const fs = require("fs");
const path = require("path");

async function setup() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

  // Remove single-line comments first, then split on semicolons
  const cleaned = sql
    .split("\n")
    .map(line => line.replace(/--.*$/, "").trimEnd())  // strip -- comments
    .join("\n");

  const statements = cleaned
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await executeQuery(statement);
      console.log("✅ Ran:", statement.slice(0, 60) + "...");
    } catch (err) {
      console.error("❌ Failed:", statement.slice(0, 60));
      console.error(err.message);
    }
  }
  console.log("🎉 Setup complete");
}

setup();