var crypto = require("crypto");
var db = require("../db");

const createAccount = function (req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    "sha256",
    function (err, hashedPassword) {
      if (err) {
        return next(err);
      }
      db.run(
        "INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)",
        [req.body.username, hashedPassword, salt],
        function (err) {
          if (err) {
            console.log(err);
            return next();
          }
          res.locals.user = {
            id: this.lastID,
            username: req.body.username,
          };
          next();
        }
      );
    }
  );
};

module.exports = {
  createAccount,
};
