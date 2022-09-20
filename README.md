# Sample-SaaS

A simple multi tenant notes app for demonstrating integration with Bunny.

The sample is built using Node + Express + Tailwind CSS.

## Install

Get this sample up and running quickly with Docker.

Pull this repo then.

```sh
> make build
> make start
```

Then access the sample at http://localhost:3030

## Develop

Run this sample in development mode which will auto rebuild on changes.

Start the main express app.

```
> make build
> make dev
```

If you want to make changes to html templates and css then also run the css rebuild using

```sh
> make build-css
```

Then access the sample at http://localhost:3030

## Beware

This is a simple app designed to demonstrate how Bunny can be used with a SaaS application. Feel free to copy how we have used the Bunny SDK but take note that we have made compromises in order to keep this simple so please don't copy the app itself, user management and session security etc.
