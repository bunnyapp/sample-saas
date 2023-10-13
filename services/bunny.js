const BunnyClient = require("@bunnyapp/api-client");
const bunny = new BunnyClient({
  baseUrl: process.env.BUNNY_BASE_URL,
  accessToken: process.env.BUNNY_ACCESS_TOKEN,
});

const getPortalToken = async function (userId, returnUrl = "") {
  var tenantCode = `sample-saas-account-${userId}`;

  console.log("Creating portal session for user", tenantCode);
  var portalSessionToken = await bunny.portalSessionCreate(
    tenantCode,
    returnUrl
  );

  return portalSessionToken;
};

module.exports = {
  getPortalToken,
};
