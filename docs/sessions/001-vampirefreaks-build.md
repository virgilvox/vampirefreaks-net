# 001: vampirefreaks.net build

Rebuild of the VampireFreaks social network era on the JIG stack, per the PRD. This log tracks the build phase by phase so anyone can pick it up.

## Decisions taken (PRD section 16 defaults)

- Branding: presents as an explicit homage and revival under vampirefreaks.net. No commerce, no store.
- Age policy: collect birthdate at onboarding, single adult-or-not gate. Stricter messaging and discoverability defaults for under-18 accounts. Exact records minimal until counsel weighs in.
- Autoplay: profile music never autoplays. Visible control, off on first visit. No member override in v1.
- Feed: query-based across source tables for v1. The materialized `activity` table is reserved for when that gets slow.
- Profile customization: structured customization first (colors, background, fonts, bounded CSS scoped to the profile body), sanitized on write. Freeform sandboxed-iframe HTML is Phase 5, deferred.

## Infra facts

- DO team: My Team. Project: lumen (`72b2a6a9-6ef1-4738-9ea4-fbeeabf2a8d7`).
- Domain `vampirefreaks.net` on DO DNS.
- Spaces bucket + CDN: `vampirefreaks.sfo3.digitaloceanspaces.com` -> `vampirefreaks.sfo3.cdn.digitaloceanspaces.com`, region sfo3.
- No managed Postgres cluster yet. Create at deploy.

## Phase log

### Phase 0: rename and reskin

- Status: code complete. package renamed to vampirefreaks-net, crypt theme added and set default (cookie vf-theme), fonts extended (Pirata One, Cinzel, Cormorant Garamond), theme test updated. Example notes/categories tables, routes, util, and old migration removed. Full social schema written (32 tables incl auth). better-auth admin plugin wired for staff roles + ban state. Migration 0000_flat_cannonball.sql generated and validated by drizzle-kit.
- Local testing note: the Docker daemon is unresponsive in this environment, so the docker-compose Postgres will not start and the e2e suite cannot run locally. Local gates are lint + typecheck + unit/component + build. Migrations and e2e run against the DO managed Postgres during deploy.
- Gates green: eslint clean, 40 unit/component tests pass, typecheck exit 0, production build exit 0.

### Phase 1: identity and social loop

- Status: code complete, gates green.
- Server utils: username (validation + reserved list), profile (requireProfile, getProfileByUsername, publicAverage), sanitize (CSS allowlist), rate-limit (in-process sliding window), session (added optionalUser, requireAdmin).
- API: profile create/me/patch, public profile read (with viewer rating + friend state + block), rating PUT (transactional aggregate), leaderboard (5-rating floor), friends (list/request/respond/remove + public list), messages (inbox/send/sent/read/single with handles), home panels.
- Pages: onboarding, public /[username], /[username]/friends, /top, /messages (+sent, +[id]), /account (profile editor + customization), /account/requests, homepage panels, about/guidelines/terms/privacy. Stubs for /cults, /forum, /events, /admin pending later phases (explicit routes so the [username] catch-all does not grab them).
- Components: VfRatingWidget, VfProfileHeader, VfProfileBody (safe structured customization, scoped sanitized CSS), VfLeaderboardPanel.
- Tests: unit for username + sanitize. e2e to run against managed PG.
- Profile customization is the structured/bounded path (PRD 10.2). Freeform sandboxed-iframe HTML (Phase 5) is deliberately not rendered.

### Deploy: live at https://vampirefreaks.net

- Architecture (per Moheeb's preference): cheapest viable droplet, image built in GitHub Actions, Postgres self-hosted on a block-storage volume. No App Platform, no managed Postgres.
- Image: GitHub Actions (`.github/workflows/deploy.yml`) builds on push to main and pushes `registry.digitalocean.com/freshblu/vampirefreaks-net:latest`. Needs repo secret `DIGITALOCEAN_ACCESS_TOKEN` (set). One Dockerfile stage keeps node_modules so the same image runs app + drizzle migrate + seed.
- Droplet: `vampirefreaks` (id 575520754), s-1vcpu-1gb ($6/mo), sfo3, Docker marketplace image, in project lumen. Block volume `vfdata` (id 6020b141..., 10 GiB) mounted at /mnt/vfdata for the Postgres data dir. 2 GB swap. cloud-init pulled the image, ran migrate + seed, started the stack.
- Stack (`/opt/vf/docker-compose.prod.yml`): postgres (volume-backed), one-shot migrate the app waits on, optional seed, app, Caddy for automatic TLS. Postgres is not published to the host; only Caddy exposes 80/443.
- DNS: A records `@` and `www` -> 64.23.227.77 on DO DNS. Caddy obtained the Let's Encrypt cert. www 301s to the apex.
- Verified live: home, /top, leaderboard, a seeded profile all 200 over HTTPS. CI (lint, typecheck, unit/component, build, e2e against real Postgres) green; the e2e also proves the migration applies.
- Redeploy: push to main (CI rebuilds), then on the droplet `cd /opt/vf && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml run --rm migrate && docker compose -f docker-compose.prod.yml up -d`.
- Follow-up hardening: `DIGITALOCEAN_ACCESS_TOKEN` in Actions is account-scoped; swap for a registry-scoped token when available. Email verification is off until Resend is configured. Spaces upload keys are not set yet (media lands in a later phase).

### VF UI overhaul + Phase 2 start (journals, status, activity)

- Reskinned the chrome to the early-2000s vampirefreaks.com layout (reference screenshot from Moheeb): blackletter wordmark + live FREAK COUNT + online badge, dense magenta nav (HOME PROFILES FRIENDS JOURNALS CULTS PICS MUSIC EVENTS SITE), left member sidebar (avatar card, Update Status, vertical links), right rails (Top Cults, Top Journals, Newest Freaks), featured row + tabbed news (Site News / Recent Journals / Activity) homepage. `VfPanel` is the reused boxed section.
- Retuned crypt to the real palette: hot magenta (#cf1d7a) chrome, crimson highlight, small Verdana/Tahoma sans body, blackletter only for the logo, near-black metal-hatch background. Removed the theme selector (ThemeSwitcher deleted from both layouts); crypt is the look. No premium, no store.
- `/api/chrome` feeds the shell (member count, online = active sessions, rails). `/api/feed/journals` and `/api/feed/site` feed the homepage.
- Journals (Phase 2): create/edit/delete/read with public/friends/private visibility enforced server-side (shared `canView`/`areFriends` helper), comments with synced counter, member journal lists, the editor, and the public-profile journal panel. Status updates post to the activity stream via the sidebar dialog.
- Tests: component tests for RatingWidget, Panel, LeaderboardPanel, JournalCard; e2e for journal publish, friends-only visibility gate (404 for non-friends, reveals after friending), comment counting, status posting. 56 unit/component pass; CI e2e green.
- Seed now adds starter journals and statuses so the feed and rails are not empty. Re-seeded live.
- Deployed: redeployed the droplet image and re-ran the seed. Live and verified.

### Phases remaining

- Phase 2 media: photo galleries on Spaces (presigned uploads, thumbnails, EXIF strip). Schema in place. `/[username]/gallery` and PICS nav still point at stubs/profile.
- Phase 3 community: cults + unified forum, roles/join policies, reporting queue, blocking routes, admin tools. Schema + stubs in place.
- Phase 4 music/events: band pages, song uploads, profile music player, events + RSVPs. Schema + stubs in place.
- Phase 5: sandboxed freeform-HTML profiles behind the age gate.
