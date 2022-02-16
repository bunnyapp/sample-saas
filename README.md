# Sample-SaaS

A simple multi tenant notes app for demonstrating integration with Recur.

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
