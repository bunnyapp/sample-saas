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
    async function verify(email, password, next) {
      try {
        const { rows } = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );
        console.log("ROWS", rows);
        if (rows.length == 0) {
          return next(null, false, {
            message: "Invalid account.",
          });
        }
        return next(null, rows[0]);
      } catch (error) {
        console.log("Error authenticating ", error);
        next(error);
      }
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
  console.log("Failed messages", req.session.messages);

  let options = {
    layout: "auth_layout",
  };

  if (req.session.messages) {
    options.failureMessage = req.session.messages[0];
  }

  res.render("sign-in", options);
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
