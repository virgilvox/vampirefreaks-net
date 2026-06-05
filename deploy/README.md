# Deploy

vampirefreaks.net runs on a single DigitalOcean droplet. The image is built in
GitHub Actions and pushed to the DO container registry; the droplet pulls it.
Postgres runs on the droplet with its data on an attached block-storage volume.

## Pieces

- `.github/workflows/deploy.yml` builds the image on every push to `main` and
  pushes `ghcr.io/virgilvox/vampirefreaks-net:latest` using the built-in
  `GITHUB_TOKEN` (no extra secret). The package is public, so the droplet pulls it
  without credentials.
- `Dockerfile` is one stage that keeps node_modules, so the same image serves the
  app and runs `npm run db:migrate` / `npm run db:seed`.
- `deploy/docker-compose.prod.yml` is the droplet stack: db (volume-backed),
  one-shot migrate, optional seed, app, and Caddy for TLS.
- `deploy/Caddyfile` proxies the domain to the app and auto-provisions TLS.
- `deploy/cloud-init.sh` is the first-boot bootstrap template. The provisioner
  fills in the secrets and registry creds and inlines the compose file and
  Caddyfile, then passes the result as droplet user-data.

## Redeploy

Push to `main` (CI rebuilds the image), then on the droplet:

```
cd /opt/vf
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Run a new migration in production

A new migration ships in the image. On the droplet:

```
cd /opt/vf
docker compose -f docker-compose.prod.yml run --rm migrate
```

## Notes

- The image is a public GHCR package, so no registry credentials live on the
  droplet. Media uploads use a bucket-scoped Spaces key in the droplet env.
- Email verification is off until Resend is configured. Set `RESEND_API_KEY`,
  `EMAIL_FROM`, and flip `REQUIRE_EMAIL_VERIFICATION=true` in the app env.
