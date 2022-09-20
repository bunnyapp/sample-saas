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

const createAccount = async function (
  firstName,
  lastName,
  username,
  password,
  max_notes
) {
  var hash = await hashPassword(password);

  return new Promise((res, rej) => {
    db.run(
      "INSERT INTO users (first_name, last_name, username, hashed_password, salt, max_notes) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, username, hash.key, hash.salt, max_notes],
      function (err) {
        if (err) {
          console.log(err);
          return res(null);
        }

        return res({
          id: this.lastID,
        });
      }
    );
  });
};

const updateAccount = async function (id, max_notes) {
  return new Promise((res, rej) => {
    db.run(
      "UPDATE users SET max_notes = ? WHERE id = ?",
      [max_notes, id],
      function (err) {
        if (err) {
          console.log(err);
          return res(false);
        }

        return res(true);
      }
    );
  });
};

module.exports = {
  createAccount,
  updateAccount,
};
