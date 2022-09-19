var express = require("express");
var router = express.Router();
var crypto = require("crypto");

var accountsService = require("../services/accounts");

function validateToken(req, res, next) {
  var bunnySignature = req.headers["x-bunny-signature"];

  var signature = crypto
    .createHmac("sha1", process.env.BUNNY_WEBHOOK_SIGNING_TOKEN)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (bunnySignature != signature) {
    return res.sendStatus(403);
  }

  next();
}

router.post("/hook", validateToken, async function (req, res, next) {
  console.log("Webhook Received", req.body);
  console.log(req.body.type);
  console.log(req.headers);

  switch (req.body.event_type) {
    case "SUBSCRIPTION_CREATE":
      var account = await accountsService.createAccount(
        req.body.account.username,
        req.body.account.password,
        req.body.features.max_notes
      );
      console.log("account", account);
      if (!account) {
        return res.json({ success: false });
      }
      return res.json({ success: true, account: { code: account.id } });

    case "SUBSCRIPTION_UPDATE":
      var success = await accountsService.updateAccount(
        req.body.account.code,
        req.body.features.max_notes
      );

      if (!success) {
        return res.json({ success: false });
      }
      return res.json({
        success: true,
        account: { code: req.body.account.code },
      });

    default:
      return res.json({ success: false });
  }
});

module.exports = router;
