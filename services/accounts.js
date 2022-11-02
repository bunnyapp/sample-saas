var db = require("../db");
const eventsService = require("./events");

const findById = async function (id) {
  console.log("Find account by id", id);

  const account_id = parseInt(id);
  if (isNaN(account_id)) return;

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [
      account_id,
    ]);

    console.log("ROWS", rows);
    if (rows.length == 0) return;

    return {
      id: rows[0].id,
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      email: rows[0].email,
      maxNotes: rows[0].max_notes,
    };
  } catch (error) {
    console.log("Error finding account", error);
    return;
  }
};

const createAccount = async function (firstName, lastName, email, max_notes) {
  try {
    const { rows } = await db.query(
      "INSERT INTO users (first_name, last_name, email, max_notes) VALUES ($1, $2, $3, $4) RETURNING id",
      [firstName, lastName, email, max_notes]
    );
    console.log("INSERT ACCOUNT", rows);

    return {
      id: rows[0].id,
    };
  } catch (error) {
    console.log("Error creating account", error);
    return;
  }
};

const updateMaxNotes = async function (id, maxNotes) {
  try {
    const { rows } = await db.query(
      "UPDATE users SET max_notes = $1 WHERE id = $2",
      [maxNotes, id]
    );

    await eventsService.createEvent(id, "Setting max notes to " + maxNotes);

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  findById,
  createAccount,
  updateMaxNotes,
};
