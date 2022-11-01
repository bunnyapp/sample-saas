var express = require("express");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var db = require("../db");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "email",
    },
    function verify(email, password, done) {
      db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        function (err, row) {
          if (err) {
            return done(err);
          }
          if (!row) {
            return done(null, false, {
              message: "Invalid account.",
            });
          }
          return done(null, row);
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
    successRedirect: "/notes",
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
