const { Pool } = require("pg");
const pool = new Pool();

const query = (text, params) => pool.query(text, params);

(async () => {
  console.log("Initializing DB");

  await pool.query(
    "CREATE TABLE IF NOT EXISTS users ( \
    id SERIAL PRIMARY KEY, \
    first_name TEXT, \
    last_name TEXT, \
    email TEXT UNIQUE, \
    max_notes INTEGER, \
    bunny_code TEXT UNIQUE \
  )"
  );

  await pool.query(
    "CREATE TABLE IF NOT EXISTS notes ( \
    id SERIAL PRIMARY KEY, \
    user_id INTEGER NOT NULL, \
    note TEXT NOT NULL, \
    completed INTEGER \
  )"
  );

  await pool.query(
    "CREATE TABLE IF NOT EXISTS events ( \
    id SERIAL PRIMARY KEY, \
    user_id INTEGER NOT NULL, \
    message TEXT NOT NULL, \
    created_at TIMESTAMP DEFAULT NOW()\
  )"
  );

  console.log("Initializing DB Complete");
})();

module.exports = {
  pool,
  query,
};
