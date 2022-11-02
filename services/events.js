var db = require("../db");

const findEvents = async function (user_id) {
  try {
    const { rows } = await db.query(
      "SELECT id, user_id, message, TO_CHAR(created_at:: DATE, 'Mon dd, yyyy') as timestamp FROM events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [user_id]
    );

    return rows;
  } catch (error) {
    console.log("Error finding events", error);
    return [];
  }
};

const allEvents = async function () {
  try {
    const { rows } = await db.query(
      "SELECT id, user_id, message, TO_CHAR(created_at:: DATE, 'Mon dd, yyyy') as timestamp FROM events ORDER BY created_at DESC LIMIT 20"
    );

    return rows;
  } catch (error) {
    console.log("Error finding all events", error);
    return [];
  }
};

const createEvent = async function (user_id, message) {
  try {
    const { rows } = await db.query(
      "INSERT INTO events (user_id, message) VALUES ($1, $2)",
      [user_id, message]
    );

    return true;
  } catch (error) {
    console.log("Error creating event", error);
    return false;
  }
};

module.exports = {
  findEvents,
  allEvents,
  createEvent,
};
