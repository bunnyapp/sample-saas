var express = require("express");
var router = express.Router();
var accountsService = require("../services/accounts");

router.get("/sign-up", function (req, res, next) {
  res.render("sign-up", {
    layout: "auth_layout",
  });
});

router.post("/sign-up", async function (req, res, next) {
  var max_notes = 3;

  var account = await accountsService.createAccount(
    req.body.username,
    req.body.password,
    max_notes
  );

  if (!account) {
    return res.redirect("/sign-up");
  }

  var user = {
    id: account.id,
    username: req.body.username,
    max_notes: max_notes,
  };

  req.login(user, function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
