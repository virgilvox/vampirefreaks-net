# JIG handoff

Snapshot of where the template stands and how to work on it. Per-session detail lives in `docs/sessions/`.

## Status

Feature-complete against the original spec (v0 through v0.2) plus extras. Everything below is built, typed, and covered by tests, and CI is green on `main`.

## What works

Auth (better-auth on a Nitro route):

- Email and password, with password reset and email verification through Resend (console fallback in dev).
- GitHub OAuth (Google switches on when its keys are set).
- Passkeys (WebAuthn): register and manage on `/account`, sign in on `/login`.
- Server sessions, a route-guard middleware, and a production guard that refuses to boot without `BETTER_AUTH_SECRET`.

Data (Postgres via Drizzle):

- Schema as code, readable migrations, an idempotent seed.
- Two example tables (`categories`, `notes`) behind a notes CRUD page at `/dashboard`, scoped per user with category-ownership checks.

Organizations (multi-tenant primitives, available but not forced):

- Create, list, set active. Invite by email, accept or decline (in-app and via the email link), list and remove members, change roles.
- Tables: `organization`, `member`, `invitation`, plus `session.active_organization_id`.

Design system:

- Flat token contract in `app/assets/design/tokens.css` (`--color-*`, `--font-*`, `--radius-block`, `--shadow-block`), wired into Tailwind v4 utilities.
- Three themes (`punk-zine`, `industrial`, `paper-teal`); swap with one `data-theme` attribute. Live switcher in the UI.
- Base components on Reka UI in `app/components/ui/`, every value from tokens.

## Run it

```bash
cp .env.example .env          # set BETTER_AUTH_SECRET
npm install
docker compose up -d db
npm run db:migrate
npm run dev                   # http://localhost:3000
```

Sign up, land on the dashboard. Then `npm run db:seed` to attach sample notes to your account. Test theme switching on the landing page, passkeys on `/account`, and organizations on `/organizations`.

## Tests

- `npm run test`: unit (`test/unit`) and component (`test/components`), no infrastructure. 28 tests.
- `npm run test:e2e`: real server plus real Postgres, no mocks. 8 tests. Needs a database:
  `docker compose up -d db`, then `DATABASE_URL=... BETTER_AUTH_SECRET=... DISABLE_RATE_LIMIT=true npm run test:e2e`.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build, then e2e against a Postgres service on every push.

## Conventions (see CLAUDE.md)

- No AI attribution anywhere, including commits. Conventional commits, atomic where possible.
- Prose rules: no em dashes, no emojis, no filler vocabulary, lead with the point.
- Components read only from design tokens, never literal colors or fonts.
- Server owns db and auth; the app reaches them only through API routes.
- Tests first from here on.

## Environment

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`, `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `REQUIRE_EMAIL_VERIFICATION`. `DISABLE_RATE_LIMIT` is test-only. See `.env.example`.

## Known gaps and next steps

- Email delivery needs a Resend domain verified before it reaches anyone but the Resend account owner. The dev transport logs links to the console.
- No leave-organization UI (the `leave` endpoint exists). Received-invitations list loads on mount, no live updates.
- The example notes stay single-user by design. Scoping them to the active organization is the pattern to copy when a product needs tenancy.
- Deploy recipe is in `docs/deploy.md`.
