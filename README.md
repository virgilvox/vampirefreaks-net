# vampirefreaks.net

A revival of the VampireFreaks social network from its 2003 to 2008 era, running at
[vampirefreaks.net](https://vampirefreaks.net). It brings back the goth and industrial
community site: customizable profiles, a 1 to 10 profile rating with leaderboards,
photo galleries, journals, user-run groups called cults, site forums, friends, private
messages, and event listings. There is no shop. Every account is the same; there are no
paid tiers, and moderation applies the same way to everyone.

Built on the JIG stack: one Nuxt 4 app, TypeScript, Postgres through Drizzle, better-auth.

## What works

- Profiles and onboarding, the public `/[username]` page, structured profile customization
  with sanitized custom CSS, and avatars from uploaded photos.
- The 1 to 10 profile rating, leaderboards at `/top`, and an opt-out that hides the number.
- Friends, private messages, and blocking that cuts contact both ways.
- Journals with public, friends-only, and private visibility, plus comments.
- Status posts and a recency-ordered activity stream.
- The site forum: boards, threads, posts, pinning and locking, with staff tools.
- Cults: create a group, set who can join, run its roster.
- Photo galleries on object storage, with set-as-avatar.
- Events with going and interested RSVPs.
- A moderation queue: members report content, staff resolve, remove, or ban.
- The early-2000s three-column shell and the dark "crypt" theme.

## Run it locally

```bash
cp .env.example .env          # set BETTER_AUTH_SECRET; SPACES_* optional until you test uploads
npm install
docker compose up -d db
npm run db:migrate
npm run db:seed               # seeds the forum boards only, no fake accounts
npm run dev                   # http://localhost:3000
```

Sign up, claim a username at `/onboarding`, then look around.

## Layout

```
app/
  components/ui/    Reka UI primitives, every value from design tokens
  components/vf/    domain components (rating widget, panels, profile body, ...)
  pages/            home, profiles, journals, forum, cults, events, messages, account, admin
  layouts/          the three-column shell and the centered auth shell
  middleware/       auth, onboarded, and admin route guards
  composables/      current user, profile, theme, toasts
  assets/design/    tokens, the crypt theme, fonts
server/
  db/               Drizzle schema, client, migrations, seed
  auth/             better-auth config (email/password, OAuth, passkeys, admin)
  api/              Nitro routes
  utils/            session, profile, friends, cult, report, sanitize, spaces, rate-limit
```

## Design system

Components read from a flat set of CSS custom properties in `app/assets/design/tokens.css`
(color roles, fonts, radius, shadow, overlay). The `crypt` theme in
`app/assets/design/themes/crypt.css` redefines those names for the goth era and is the
default. Components never hardcode a color or font; they use `var(--*)`.

## Scripts

| Command                             | Does                                 |
| ----------------------------------- | ------------------------------------ |
| `npm run dev`                       | Dev server                           |
| `npm run build` / `npm run preview` | Production build and run             |
| `npm run db:generate`               | Generate a migration from the schema |
| `npm run db:migrate`                | Apply migrations                     |
| `npm run db:seed`                   | Seed the forum boards                |
| `npm run admin:grant -- <email>`    | Make an account staff                |
| `npm run lint` / `npm run format`   | Lint and format                      |
| `npm run typecheck`                 | Type check                           |
| `npm run test`                      | Unit and component tests             |
| `npm run test:e2e`                  | Integration tests (needs Postgres)   |

## Testing

`npm run test` runs the unit and component suites in the Nuxt environment, no
infrastructure needed. The integration suite boots the real server against a real
Postgres, applies the migration, and exercises the social loop. With a database up:

```bash
docker compose up -d db
DATABASE_URL=postgres://jig:jig@localhost:5432/jig \
  BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
  DISABLE_RATE_LIMIT=true \
  npm run test:e2e
```

CI runs lint, typecheck, the unit and component tests, the build, and the e2e suite on
every push.

## Deploy

The site runs on a single DigitalOcean droplet. The image is built in GitHub Actions and
pushed to the GitHub Container Registry; the droplet pulls it and runs the app, Postgres
(data on an attached block-storage volume), and Caddy for TLS through docker compose.
Photo and event media live in DigitalOcean Spaces. See `deploy/README.md` and
`docs/sessions/` for the full setup and the redeploy steps.

## License

MIT. Built by [hack.build](https://hack.build).
