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

function validateWebhookSignature(req, res, next) {
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

function getNotesAllowedFromSubcriptions(subscriptions) {
  const notesAllowed = subscriptions[0].features.find((f) => f.code == "notes");
  return notesAllowed?.quantity || 3;
}

router.post("/hook", validateWebhookSignature, async function (req, res, next) {
  console.log("Webhook Received", req.body);
  console.log(req.body.type);
  console.log(req.headers);

  const payload = req.body.payload;
  console.log(payload);

  switch (req.body.type) {
    case "TenantProvisioningChange":
      if (payload.tenant.code == "provisioning-test")
        return res.sendStatus(200);

      var accountId = payload.tenant.code.replace("sample-saas-account-", "");
      var account = await accountsService.findById(accountId);
      console.log("ACCOUNT", account);

      const contact = payload.tenant.account.contacts[0];
      const subscription = payload.change.subscriptions[0];

      await eventsService.createEvent(
        0,
        "Provisioning request received from Bunny for tenant " +
          payload.tenant.code
      );

      const maxNotes = getNotesAllowedFromSubcriptions(
        payload.change.subscriptions
      );

      if (account) {
        await eventsService.createEvent(
          account.id,
          "Subscription state: " + subscription.state
        );

        await eventsService.createEvent(
          account.id,
          "Updating account features"
        );

        await eventsService.createEvent(
          account.id,
          "Maximum notes set to " + maxNotes.toString()
        );

        // Update the account
        const updateResponse = await accountsService.updateMaxNotes(
          account.id,
          maxNotes
        );

        return res.json({ success: updateResponse });
      } else {
        // Create a new account
        var account = await accountsService.createAccount(
          contact.first_name,
          contact.last_name,
          contact.email,
          maxNotes
        );

        await eventsService.createEvent(
          account.id,
          "Account created via Bunny provisioning"
        );

        await eventsService.createEvent(
          account.id,
          "Maximum notes set to " + maxNotes.toString()
        );

        try {
          // Then update the tenantCode on Bunny
          const tenant = await bunny.tenantUpdate(
            payload.tenant.id,
            account.id,
            payload.tenant.name
          );

          await eventsService.createEvent(
            account.id,
            "Updated tenant code in Bunny to " + account.id.toString()
          );
        } catch (error) {
          console.log("Updating Bunny Tenant Failed", error);
        }
      }

      return res.json({ success: true });

    default:
      return res.sendStatus(400);
  }
});

module.exports = router;
