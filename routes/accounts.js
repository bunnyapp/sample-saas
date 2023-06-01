var express = require("express");
var router = express.Router();
var accountsService = require("../services/accounts");
var eventsService = require("../services/events");

const BunnyClient = require("@bunnyapp/api-client");
const bunny = new BunnyClient({
  baseUrl: process.env.BUNNY_BASE_URL,
  accessToken: process.env.BUNNY_ACCESS_TOKEN,
});

router.get("/sign-up", function (req, res, next) {
  res.render("sign-up", {
    layout: "auth_layout",
  });
});

router.get("/manage", async function (req, res, next) {
  try {
    var tenantCode = `sample-saas-account-${req.user.id}`;
    var returnUrl = req.protocol + "://" + req.get("host") + req.originalUrl;

    console.log("Creating portal session for user", tenantCode);
    result = await bunny.createPortalSession(tenantCode, returnUrl);

    if (result.errors) {
      console.log("Error creating portal session", result.errors);
      return res.sendStatus(400);
    }

    const portalSessionToken = result.data.portalSessionCreate.token;

    res.redirect(
      `${process.env.BUNNY_BASE_URL}/portal/subscriptions?token=${portalSessionToken}`
    );
  } catch (error) {
    console.log("Error sending portal session request", error);
    return res.sendStatus(400);
  }
});

router.post("/sign-up", async function (req, res, next) {
  var max_notes = 3;

  const { firstName, lastName, email } = req.body;

  var account = await accountsService.createAccount(
    firstName,
    lastName,
    email,
    max_notes
  );

  if (!account) {
    return res.redirect("/accounts/sign-up");
  }
  await eventsService.createEvent(
    account.id,
    "Account created via sign up page"
  );

  try {
    var priceListCode = process.env.SUBSCRIPTION_PRICE_LIST_CODE;

    // Create a trial subscription in Bunny
    var response = await bunny.createSubscription(priceListCode, {
      accountName: `${firstName} ${lastName}`,
      firstName: firstName,
      lastName: lastName,
      email: email,
      trial: true,
      tenantCode: `sample-saas-account-${account.id}`,
    });

    if (response.errors) {
      // The subscription was not created in Bunny
      // so log this and try again...
      console.log("Error creating subscription in bunny", response.errors);
      await eventsService.createEvent(
        account.id,
        "Failed to create subscription in Bunny"
      );
    } else {
      await eventsService.createEvent(
        account.id,
        "Subscription created in Bunny"
      );
    }
  } catch (error) {
    console.log("Error creating subscription in Bunny", error);
    await eventsService.createEvent(
      account.id,
      "Error creating subscription in Bunny"
    );
  }

  var user = {
    id: account.id,
    email: email,
    max_notes: max_notes,
  };

  req.login(user, function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/notes");
  });
});

module.exports = router;
