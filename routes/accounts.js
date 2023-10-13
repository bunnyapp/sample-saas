var express = require("express");
var router = express.Router();
var accountsService = require("../services/accounts");
var eventsService = require("../services/events");
var bunnyService = require("../services/bunny");

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
    var returnUrl = `${req.protocol}://${req.get("host")}/notes`;

    const portalSessionToken = bunnyService.getPortalToken(
      req.user.id,
      returnUrl
    );

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
    await bunny.subscriptionCreate(priceListCode, {
      accountName: `${firstName} ${lastName}`,
      firstName: firstName,
      lastName: lastName,
      email: email,
      trial: true,
      evergreen: true,
      tenantCode: `sample-saas-account-${account.id}`,
    });

    await eventsService.createEvent(
      account.id,
      "Subscription created in Bunny"
    );
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
