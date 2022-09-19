var sqlite3 = require("sqlite3");
var mkdirp = require("mkdirp");

mkdirp.sync("var/db");

var db = new sqlite3.Database("var/db/sample-saas.db");

db.serialize(function () {
  db.run(
    "CREATE TABLE IF NOT EXISTS users ( \
    id INTEGER PRIMARY KEY AUTOINCREMENT, \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    salt BLOB, \
    max_notes INTEGER, \
    bunny_code TEXT UNIQUE \
  )"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS notes ( \
    id INTEGER PRIMARY KEY AUTOINCREMENT, \
    user_id INTEGER NOT NULL, \
    note TEXT NOT NULL, \
    completed INTEGER \
  )"
  );
});

module.exports = db;
