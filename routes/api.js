var express = require("express");
var router = express.Router();
var crypto = require("crypto");

var accountsService = require("../services/accounts");

function validateToken(req, res, next) {
  var recurSignature = req.headers["x-recur-signature"];

  var signature = crypto
    .createHmac("sha1", process.env.RECUR_WEBHOOK_SIGNING_TOKEN)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (recurSignature != signature) {
    return res.sendStatus(403);
  }

  next();
}

router.post(
  "/hook",
  validateToken,
  accountsService.createAccount,
  function (req, res, next) {
    var user = res.locals.user;

    if (!user) {
      return res.json({ success: false, user: null });
    }

    res.json({ success: true, user: user });
  }
);

module.exports = router;
