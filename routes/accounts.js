var express = require("express");
var router = express.Router();
var accountsService = require("../services/accounts");

const BunnyClient = require("@bunnyapp/api-client");
const bunny = new BunnyClient({
  baseUrl: process.env.BUNNY_BASE_URL,
  accessToken: process.env.BUNNY_ACCESS_TOKEN,
  scope: process.env.BUNNY_SCOPE,
});

router.get("/sign-up", function (req, res, next) {
  res.render("sign-up", {
    layout: "auth_layout",
  });
});

router.post("/sign-up", async function (req, res, next) {
  var max_notes = 3;

  const { firstName, lastName, email, password } = req.body;

  var account = await accountsService.createAccount(
    firstName,
    lastName,
    email,
    password,
    max_notes
  );

  if (!account) {
    return res.redirect("/accounts/sign-up");
  }

  // Track the signup to Bunny
  var response = await bunny.createSubscription(
    `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    "pro",
    {
      trial: true,
      tenantCode: account.id.toString(),
    }
  );
  if (response.errors) {
    // The subscription was not created in Bunny
    // so log this and try again...
    console.log("Error tracking subscription to bunny", response.errors);
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
    res.redirect("/");
  });
});

module.exports = router;
