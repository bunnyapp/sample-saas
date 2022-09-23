var express = require("express");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var crypto = require("crypto");
var db = require("../db");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function verify(email, password, cb) {
      db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        function (err, row) {
          if (err) {
            return cb(err);
          }
          if (!row) {
            return cb(null, false, {
              message: "Incorrect email or password.",
            });
          }
          console.log("ROW", row);
          crypto.pbkdf2(
            password,
            row.salt,
            310000,
            32,
            "sha256",
            function (err, hashedPassword) {
              if (err) {
                return cb(err);
              }
              if (
                !crypto.timingSafeEqual(row.hashed_password, hashedPassword)
              ) {
                return cb(null, false, {
                  message: "Incorrect email or password.",
                });
              }
              return cb(null, row);
            }
          );
        }
      );
    }
  )
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      email: user.email,
      max_notes: user.max_notes,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

var router = express.Router();

router.get("/sign-in", function (req, res, next) {
  res.render("sign-in", {
    layout: "auth_layout",
  });
});

router.post(
  "/sign-in",
  passport.authenticate("local", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/auth/sign-in",
    failureMessage: true,
  })
);

router.get("/sign-out", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/auth/sign-in");
  });
});

module.exports = router;
