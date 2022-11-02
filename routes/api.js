var express = require("express");
var router = express.Router();
var crypto = require("crypto");

var accountsService = require("../services/accounts");
var eventsService = require("../services/events");

const BunnyClient = require("@bunnyapp/api-client");
const bunny = new BunnyClient({
  baseUrl: process.env.BUNNY_BASE_URL,
  accessToken: process.env.BUNNY_ACCESS_TOKEN,
  scope: process.env.BUNNY_SCOPE,
});

function validateToken(req, res, next) {
  var bunnySignature = req.headers["x-bunny-signature"];

  var signature = crypto
    .createHmac("sha1", process.env.BUNNY_WEBHOOK_SIGNING_TOKEN)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (bunnySignature != signature) {
    console.log(
      "Bunny signature validation failed. Check your signing tokens match"
    );
    return res.sendStatus(403);
  }

  next();
}

function getNotesAllowedFromSubcription(subscription) {
  const notesAllowed = payload.change.subscriptions[0].features.find(
    (f) => f.code == "notes"
  );
  return notesAllowed?.quantity || 3;
}

router.post("/hook", validateToken, async function (req, res, next) {
  console.log("Webhook Received", req.body);
  console.log(req.body.type);
  console.log(req.headers);

  const payload = req.body.payload;
  console.log(payload);

  switch (req.body.type) {
    case "TenantProvisioningChange":
      if (payload.tenant.code == "provisioning-test")
        return res.sendStatus(200);

      var account = await accountsService.findById(payload.tenant.code);
      console.log("ACCOUNT", account);

      const contact = payload.tenant.account.contacts[0];
      const subscription = payload.change.subscriptions[0];

      await eventsService.createEvent(
        account.id,
        "Provisioning request received from Bunny"
      );

      if (account) {
        await eventsService.createEvent(
          account.id,
          "Updating account features"
        );

        // Update the account
        const updateResponse = await accountsService.updateMaxNotes(
          account.id,
          getNotesAllowedFromSubcription(subscription)
        );

        return res.json({ success: updateResponse });
      } else {
        await eventsService.createEvent(
          account.id,
          "Provisioning new account for " + contact.email
        );

        // Create a new account
        var account = await accountsService.createAccount(
          contact.first_name,
          contact.last_name,
          contact.email,
          "testonly",
          getNotesAllowedFromSubcription(subscription)
        );

        // Then update the tenantCode on Bunny
        const bunnyResponse = await bunny.updateTenant(
          payload.tenant.id,
          account.id,
          payload.tenant.name
        );
        if (bunnyResponse.errors || !bunnyResponse.tenant) {
          console.log("Updating Bunny Tenant Failed", bunnyResponse);
        } else {
          await eventsService.createEvent(
            account.id,
            "Updated tenant code in Bunny to " + account.id.toString()
          );
        }
      }

      return res.json({ success: true });

    default:
      return res.sendStatus(400);
  }
});

module.exports = router;
