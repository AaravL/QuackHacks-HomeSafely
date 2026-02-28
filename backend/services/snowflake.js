const snowflake = require('snowflake-sdk');
const dotenv = require('dotenv');

dotenv.config();

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  user: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
});

const connectToSnowflake = async () => {
  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err.message);
        reject(err);
      } else {
        console.log('Successfully connected to Snowflake');
        resolve(conn);
      }
    });
  });
};

const executeQuery = async (sql, binds = []) => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      binds: binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Error executing query:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      },
    });
  });
};

module.exports = {
  connectToSnowflake,
  executeQuery,
  connection,
};
