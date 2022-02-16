var express = require("express");
var ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
var db = require("../db");

var ensureLoggedIn = ensureLogIn("/sign-in");

var router = express.Router();

router.get("/", ensureLoggedIn, function (req, res, next) {
  db.all(
    "SELECT * FROM notes WHERE user_id = ?",
    [req.user.id],
    function (err, rows) {
      if (err) {
        return next(err);
      }

      res.render("index", {
        notes: rows,
        layout: "layout",
      });
    }
  );
});

router.get("/notes/new", ensureLoggedIn, function (req, res, next) {
  res.render("note", {
    title: "New Note",
    action: "/notes",
    layout: "layout",
  });
});

router.post("/notes", ensureLoggedIn, function (req, res, next) {
  let note = req.body.note.trim();

  if (note.length == 0) {
    return res.redirect("/note/new");
  }

  db.run(
    "INSERT INTO notes (user_id, note) VALUES (?, ?)",
    [req.user.id, req.body.note],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect("/");
    }
  );
});

router.get("/notes/:id", ensureLoggedIn, function (req, res, next) {
  db.all(
    "SELECT * FROM notes WHERE user_id = ? and id = ?",
    [req.user.id, req.params.id],
    function (err, rows) {
      if (err) {
        return next(err);
      }

      res.render("note", {
        title: "Edit Note",
        action: "/notes/" + req.params.id,
        note: rows[0],
        layout: "layout",
      });
    }
  );
});

router.post("/notes/:id", ensureLoggedIn, function (req, res, next) {
  db.all(
    "UPDATE notes SET note = ? WHERE user_id = ? and id = ?",
    [req.body.note, req.user.id, req.params.id],
    function (err, rows) {
      if (err) {
        return next(err);
      }
      return res.redirect("/");
    }
  );
});

module.exports = router;
