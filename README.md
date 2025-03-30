# Cloudflare D1 Template

This is a template for a SaaS application using Cloudflare Workers and D1. It uses the [OpenNext](https://opennext.js.org/cloudflare) framework to build a SaaS application.

Have a look at the [project plan](./cursor-docs/project-plan.md) to get an overview of the project.

Fork (with some changes) of this excelent template: [Cloudflare Workers SaaS Template](https://github.com/LubomirGeorgiev/cloudflare-workers-nextjs-saas-template)

# Features

- Auth.js

# Running it locally

1. `pnpm install`
2.  Copy `.dev.vars.example` to `.dev.vars` and fill in the values.
3.  Copy `.env.example` to `.env` and fill in the values.
4. `pnpm db:migrate:dev` - Creates a local SQLite database and applies migrations
5. `pnpm dev`
6.  Open http://localhost:3000

## Changes to wrangler.jsonc

After making a change to wrangler.jsonc, you need to run `pnpm cf-typegen` to generate the new types.
