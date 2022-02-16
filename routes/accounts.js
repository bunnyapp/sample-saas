var express = require("express");
var router = express.Router();
var accountsService = require("../services/accounts");

router.get("/sign-up", function (req, res, next) {
  res.render("sign-up", {
    layout: "auth_layout",
  });
});

router.post(
  "/sign-up",
  accountsService.createAccount,
  function (req, res, next) {
    var user = res.locals.user;

    if (!user) {
      return res.redirect("/sign-up");
    }

    req.login(user, function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  }
);

module.exports = router;
