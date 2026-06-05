# 001 - v0 skeleton

## What was done

Stood up the full v0 of JIG, plus the design-system pieces that were cheap to pull forward from v0.1.

- Root config: Nuxt 4, Tailwind v4 via the Vite plugin, TypeScript strict, ESLint flat config, Prettier, Vitest, Dockerfile, docker-compose for Postgres.
- Design layer: the token contract in `tokens.css`, three theme files (`punk-zine`, `industrial`, `paper-teal`), font loading, and the Tailwind entry that wires tokens into utilities.
- Database: Drizzle schema with better-auth core tables plus two example tables (`categories`, `notes`), a typed client, and a seed script.
- Auth: better-auth on a Nitro catch-all route, email and password plus GitHub OAuth (Google switches on when its keys are set), a `requireUser` server guard, and an auth route middleware.
- Components: Button, Input, FormField, Card, Select, Dialog, Dropdown, Tabs, Table, Toaster, all reading from tokens.
- Pages: landing with a live theme switch, the auth flow (login, signup, forgot, reset), and a protected notes CRUD dashboard.
- Tests: a Button component test and a theme-list test.

## Decisions

- Took the recommended defaults from the spec: better-auth over nuxt-auth-utils, Nitro as the backend (no Rust service baked in).
- All three themes ship now. They are one CSS file each, so there was no reason to hold two back to v0.1.
- Server secrets are read from `process.env` in `server/`, not threaded through runtimeConfig, since they are only used server-side.
- Table uses scoped CSS with `var(--*)` directly; the rest of the components use token-backed Tailwind utilities. Both flow through the same tokens.

## Open questions

- Email sending is not wired, so `requireEmailVerification` is off and the reset-password flow has no delivery mechanism yet. Pick a provider before turning verification on.
- Passkeys, the email-verify page, and org/multi-tenant primitives are still ahead (v0.1, v0.2).

## Next steps

- Run `npm install`, then `npm run db:generate && npm run db:migrate` to create the first migration.
- v0.1: passkeys, email verification page and delivery, a richer theme-switch demo.
- v0.2: org and multi-tenant primitives, a deploy recipe.
