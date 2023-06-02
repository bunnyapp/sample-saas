# Sample-SaaS

A simple multi tenant notes app for demonstrating integration with Bunny.

The sample is built using Node + Express + Tailwind CSS.

## What does it do?

Sign in/sign up is email address. There are no passwords or magic links. This is just a demo app so we're not focussed on account security in this case.

- If you sign up for a new account at `/accounts/sign-up` it will

  - create a new tenant/account in sample-saas
  - create a new account & subscription in Bunny
  - set the local `account.id` as the `tenantCode` for this account in Bunny

- If you select "Manage Subscription" in the top menu it will redirect you to Bunny's subscription management portal where you can upgrade or modify subscriptions, and make payments etc.

- When a webhook is recieved from Bunny at `/api/hook` it will
  - validate the incoming webhook signature from the request header using a shared signing token
  - check if the tenant in the webhook payload matches with any accounts store locally.
    - if _no_ account is found it will create one and set the max notes allowance
    - if an account is found it will update the max notes allowance for that account

## Setup

Get this sample up and running quickly with Docker.

Pull this repo.

Then rename `.env.sample` to `.env` and set the required ENV vars.

You will need to create an API Client in Bunny and assign the following scopes.

```
standard:read standard:write product:read product:write security:read security:write
```

```sh
> make build
> make start
```

Then access the sample at http://localhost:3030

## Develop

Run this sample in development mode which will auto rebuild on changes.

Start the main express app.

```
> npm install
> npm run dev
```

If you want to make changes to html templates and css then also run the css rebuild using

```sh
> npm run build-css
```

Then access the sample at http://localhost:3030

## Beware

This is a simple app designed to demonstrate how Bunny can be used with a SaaS application. Feel free to copy how we have used the Bunny SDK but take note that we have made compromises in order to keep this simple so please don't copy the app itself, user management and session security etc.

## Running samplesaas locally

- Copy .env.sample to .env
- Add NODE_TLS_REJECT_UNAUTHORIZED=0 to .env
- Add samplesaas.bunny.internal to /etc/hosts
- Create a local postgres database called samplesaas
- Create an API client
  Enable scopes: security:read/write, standard:read/write, product:read/write
  Enable Client Credentials Grant
  Generate access token and copy to the .env file
- Create a product that has a price list that matches SUBSCRIPTION_PRICE_LIST_CODE in .env
  Make sure the product has platform Main
- Enable provisioning on platform Main
- Run npm install
- Run PORT=3005 npm start

Now you should be able to access samplesaas at localhost:3005