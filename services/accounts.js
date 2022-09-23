var crypto = require("crypto");
var db = require("../db");

async function hashPassword(password) {
  var salt = crypto.randomBytes(16);

  return new Promise((res, rej) => {
    crypto.pbkdf2(password, salt, 310000, 32, "sha256", (err, key) => {
      err ? rej(err) : res({ salt, key });
    });
  });
}

const findById = async function (id) {
  console.log("Find account by id", id);

  return new Promise((res, rej) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], function (err, row) {
      if (err) {
        console.log(err);
        return rej(err);
      }
      console.log("ROW", row);
      if (!row) return res();

      return res({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        maxNotes: row.max_notes,
      });
    });
  });
};

const createAccount = async function (
  firstName,
  lastName,
  email,
  password,
  max_notes
) {
  var hash = await hashPassword(password);

  return new Promise((res, rej) => {
    db.run(
      "INSERT INTO users (first_name, last_name, email, hashed_password, salt, max_notes) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, hash.key, hash.salt, max_notes],
      function (err) {
        if (err) {
          console.log(err);
          return rej(err);
        }

        return res({
          id: this.lastID,
        });
      }
    );
  });
};

const updateMaxNotes = async function (id, maxNotes) {
  return new Promise((res, rej) => {
    db.run(
      "UPDATE users SET max_notes = ? WHERE id = ?",
      [maxNotes, id],
      function (err) {
        if (err) {
          console.log(err);
          return rej(err);
        }

        return res(true);
      }
    );
  });
};

module.exports = {
  findById,
  createAccount,
  updateMaxNotes,
};
