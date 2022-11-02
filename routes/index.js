var express = require("express");
var ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
var db = require("../db");

var ensureLoggedIn = ensureLogIn("/auth/sign-in");

var router = express.Router();

router.get("/", function (req, res, next) {
  res.redirect("/notes");
});

router.get("/notes", ensureLoggedIn, async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM notes WHERE user_id = $1", [
      req.user.id,
    ]);

    res.render("notes", {
      notes: rows,
      total_notes: rows.length,
      max_notes: req.user.max_notes,
      can_create_notes: rows.length < req.user.max_notes,
      layout: "layout",
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/notes/new", ensureLoggedIn, function (req, res, next) {
  res.render("note", {
    title: "New Note",
    action: "/notes",
    layout: "layout",
  });
});

router.post("/notes", ensureLoggedIn, async (req, res, next) => {
  let note = req.body.note.trim();

  if (note.length == 0) {
    return res.redirect("/note/new");
  }

  try {
    const { rows } = await db.query(
      "INSERT INTO notes (user_id, note) VALUES ($1, $2)",
      [req.user.id, req.body.note]
    );

    return res.redirect("/notes");
  } catch (error) {
    return next(error);
  }
});

router.get("/notes/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const { rows } = db.query(
      "SELECT * FROM notes WHERE user_id = $1 and id = $2",
      [req.user.id, req.params.id]
    );

    res.render("note", {
      title: "Edit Note",
      action: "/notes/" + req.params.id,
      note: rows[0],
      layout: "layout",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/notes/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "UPDATE notes SET note = $1 WHERE user_id = $2 and id = $3",
      [req.body.note, req.user.id, req.params.id]
    );

    return res.redirect("/notes");
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
