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
    // Create a trial subscription in Bunny
    var response = await bunny.createSubscription("starter_monthly", {
      accountName: `${firstName} ${lastName}`,
      firstName: firstName,
      lastName: lastName,
      email: email,
      trial: true,
      tenantCode: account.id.toString(),
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
