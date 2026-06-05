# Deploy

JIG builds to a plain Node server (`.output/server/index.mjs`), so it runs anywhere Node runs: a VPS, a container platform, or a PaaS. The steps are the same everywhere.

## What you need in production

- A Postgres database, reachable over `DATABASE_URL`.
- A long random `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`). The server refuses to boot in production without it.
- `BETTER_AUTH_URL` and `NUXT_PUBLIC_AUTH_BASE_URL` set to your public origin, for example `https://app.example.com`.
- OAuth keys (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) with callback URLs pointed at the public origin.
- For email, `RESEND_API_KEY` and an `EMAIL_FROM` on a domain verified in Resend. Set `REQUIRE_EMAIL_VERIFICATION=true` once email is live.

Passkeys bind to the origin hostname. The `rpID` derives from `BETTER_AUTH_URL`, so set it correctly and serve over HTTPS.

## Run migrations on deploy

Migrations are not applied automatically. Run them against the production database before or during release:

```bash
DATABASE_URL=... npm run db:migrate
```

Treat this as a release step in your pipeline so the schema is current before new code serves traffic.

## Docker

The repo ships a Dockerfile (multi-stage, runs the Node output) and a compose file.

Build and run the app with its own database:

```bash
docker compose --profile full up --build
```

Or build the image alone and point it at a managed Postgres:

```bash
docker build -t jig .
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_URL=https://app.example.com \
  -e NUXT_PUBLIC_AUTH_BASE_URL=https://app.example.com \
  jig
```

## Without Docker

```bash
npm ci
npm run build
DATABASE_URL=... BETTER_AUTH_SECRET=... node .output/server/index.mjs
```

Put it behind a reverse proxy (Caddy, nginx, a platform router) that terminates TLS and forwards to port 3000. Keep the process under a supervisor (systemd, the platform's own runner) so it restarts on failure.

## Checklist

- `DATABASE_URL` points at production Postgres, migrations applied.
- `BETTER_AUTH_SECRET` set, unique to this environment.
- `BETTER_AUTH_URL` and `NUXT_PUBLIC_AUTH_BASE_URL` match the public HTTPS origin.
- OAuth callback URLs updated for the origin.
- `RESEND_API_KEY` and `EMAIL_FROM` set, `REQUIRE_EMAIL_VERIFICATION` decided.
- TLS terminated in front of the Node server.
