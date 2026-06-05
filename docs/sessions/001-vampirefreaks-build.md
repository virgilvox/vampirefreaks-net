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

### Audit pass + forum + dummy removal

- Audit fixes: `/api/profile/me` returns null (not 401) for signed-out visitors since the shell calls it everywhere; post-auth redirects no longer point at the deleted `/dashboard` (sign-in -> `/`, sign-up -> `/onboarding`, verify-email links fixed); login only offers configured sign-in methods via the public `/api/auth-providers` endpoint (GitHub/Google hidden unless their keys are set; email + passkey always); fixed the broken MUSIC (`/bands`) and PICS (`/[username]/gallery`) nav with real placeholder pages; the "Messageboard" link now points at the forum, not the inbox.
- Forum (Phase 3 start): `/api/boards`, `/api/boards/[slug]/threads`, `POST /api/threads` (thread + opening post in one txn), `GET /api/threads/[id]`, `POST /api/posts` (locked threads rejected, counters synced), `PATCH /api/threads/[id]` (staff pin/lock, audit-logged). Pages: `/forum`, `/forum/[boardSlug]`, `/forum/[boardSlug]/[threadId]` with new-thread dialog, reply form, and staff controls. e2e covers the thread/reply/lock flow.
- Dummy data removed: the seed now creates only the real forum boards, no fake members or posts. Deleted the 5 seeded `@vf.local` accounts from the live DB (cascaded their ratings, journals, statuses). Boards kept; the one real account preserved. Redeployed and verified live.

### Deep audit + cults + blocking

- Ran four parallel audit agents (security, data-integrity, frontend/routing, conventions/tests). Fixes applied:
  - Security: sanitizer now strips all at-rules (block-aware) and `position:fixed/sticky` so member CSS cannot escape its scope or overlay the app; ProfileBody container clips + isolates; svg data URIs excluded from url(). Block enforcement added to rating and journal comments via a shared `isBlocked`. Profile patch no longer accepts avatar/banner/song ids (latent IDOR until media ownership exists). Rating response no longer leaks average/count for opted-out targets.
  - SSR: viewer-dependent reads (`/[username]`, journal entry, messages, cult page) now forward the cookie on the server, fixing wrong-on-first-paint and the friends-only/private flash.
  - Routing/UX: reserved usernames extended (journals, journal, gallery, organizations); `/admin` gated by a new `admin` role middleware; tokenized the layout's hardcoded colors (added `--color-logo`, `--color-topbar-from/-to`, `--color-accent-bright`, `--color-texture`); deleted the orphaned org pages/components (organizations, accept-invitation, MyInvitations, OrgMembers).
  - Conventions: removed em dashes; `useToast` key jig-toasts -> vf-toasts; removed the dead `isReservedUsername` export.
  - DB: added `session_expires_idx` (chrome online-count filtered it every page) -> migration 0001.
- Cults built: browse/create (slug from name, owner seeded as member), cult page, join (open/approval/closed), leave (owner blocked), owner/mod management (approve, promote/demote, remove), member count maintained in transactions. Fixes the previously-broken Top Cults rail link.
- Blocking built: block/unblock endpoints (clears friendship on block) + a Block control on profiles, making the block enforcement reachable.
- Tests: sanitizer hardening unit tests; e2e for cults (open join, approval gate, closed reject, owner-cannot-leave) and blocking (stops rating + messaging, unblock restores). 60 unit/component pass; CI e2e green.
- HANDOFF.md rewritten for vampirefreaks (was still the JIG template handoff).

### Moderation and reporting (Phase 3 safety loop)

- Members report a profile, journal, forum post, or cult via a `VfReportButton`; the report snapshots a label + link (migration 0002 adds `reports.target_label/target_href`) so the queue survives content deletion.
- Staff queue at `/admin` (gated by the `admin` role middleware): resolve, dismiss, remove content (`/api/admin/remove`, fixes thread counts + auto-resolves related reports), or ban a reported member via the better-auth admin endpoint. Every action is audit-logged.
- `npm run admin:grant -- <email>` promotes the first moderator (roles are not self-serve). To make yourself staff on the live site: SSH to the droplet, `cd /opt/vf`, then `docker compose -f docker-compose.prod.yml run --rm -e DATABASE_URL=postgres://vf:<pw>@db:5432/vf app npm run admin:grant -- you@email` (or run the SQL `update "user" set role='admin' where email=...`).
- e2e covers reporting, the staff-only gate (non-admin 403), and staff removal. 60 unit/component pass; CI e2e green. Deployed and verified.

### Photo galleries, routing-bug fix, copy cleanup, registry move

- Galleries (Phase 2 media, live): server-to-Spaces upload via a hand-rolled SigV4 PUT (no AWS SDK, no browser CORS), bucket-scoped Spaces key minted with `doctl spaces keys create`. Upload, set-as-avatar (one txn), caption, delete, lightbox at `/[username]/gallery`; avatar renders on the profile header; a pics strip on the profile. EXIF/thumbnails/photo-ratings deferred. Verified the signing end to end (PUT 200, CDN GET 200).
- Routing bug FIXED: `pages/[username].vue` and `pages/account.vue` were acting as parent route components with no `<NuxtPage>`, so every nested route (My Journal, Friends, Pics, Friend Requests, journal editor) rendered the parent profile/account page. Moved both to `index.vue` so children are siblings. Verified live: `/virgilvox` is the profile while `/virgilvox/journal|friends|gallery` each render their own page.
- Copy: removed the LLM/marketing lines ("No store, no premium.", "Welcome to the crypt", "Join the night", homage/"good parts" blurbs, "not a free-for-all") for plain wording. Added a GitHub link to the repo in the footer. Re-verified zero em dashes anywhere.
- Registry: the shared DO container registry hit its storage quota (push denied, deployed tag went stale). Switched image builds to GHCR (`ghcr.io/virgilvox/vampirefreaks-net:latest`, public package, built-in GITHUB_TOKEN, only `:latest` tag). Droplet `APP_IMAGE` repointed to GHCR; redeployed and verified the new image is serving.
- Note: the live owner account is `virgilvox` (Moheeb). Make it staff with `npm run admin:grant -- <email>` to use the moderation queue.

### Third audit, avatar fix, gallery hardening

- Made `virgilvox` (the owner account) staff via SQL; the Moderation queue is now reachable for them.
- Fixed the reported avatar bug: the first uploaded photo was flagged primary but the upload never set `profiles.avatarPhotoId`, so the header kept showing the letter square. Now set in the same transaction; backfilled the live row so the existing photo shows immediately. Deleting the avatar promotes the newest remaining photo (transactional).
- Security (from the audit): upload now sniffs real image magic bytes and derives the stored type/extension from them (client content-type no longer trusted), plus a per-user photo cap and tighter rate limit. Baseline security headers (nosniff, X-Frame-Options, Referrer-Policy) on every response via routeRules.
- Avatars now render in the leaderboard, homepage panels, featured member, and friends grid (these returned a dead `avatarPhotoId` before; now resolve `avatarUrl`).
- Polish: lightbox is keyboard-accessible (focus/Escape/role) and uses a new `--color-overlay` token; reserved photo-rating/album schema documented; dropped an unused export; onboarding title reworded.
- Voice/routing re-audited: no em dashes anywhere, the `[username]/account` index-route fix holds, no broken links.
- Tests: e2e for set-as-avatar and avatar promotion on delete. 58 unit/component pass; CI green; deployed and verified live.

### Events + avatar upload in the editor

- Events (Phase 4): `/api/events` (list split upcoming/past, city filter, going counts), create/get/patch/delete (creator or staff), `/events/[id]/rsvp` (going/interested/none, one per member). Pages `/events` (list + create dialog + filter) and `/events/[id]` (detail + RSVP + delete). EVENTS nav now real. e2e covers create, RSVP count, upcoming listing, creator-only delete.
- Avatar upload added to the profile editor (`/account`): posts through the photo pipeline and sets the result primary, with a live preview. Reuses the existing endpoints, no new backend.
- 58 unit/component pass; CI green; deployed and verified (`/events` 200, gated POST 401).

### UI/UX audit pass, branding, README

- Correctness/security: ongoing events stay in Upcoming (split on coalesce(endsAt, startsAt)); event url validated http(s)-only on create/edit; endsAt cannot predate startsAt; avatar-from-editor is one server call via a `primary` flag on the photo upload (no partial state).
- UI/UX: one `.vf-page-title` class across all in-shell pages (was a mix of dense vs oversized headings); mobile puts content above the sidebars and keeps the nav as one scrollable strip (drops the duplicate quick links); raised `--color-muted` contrast in crypt; homepage Featured Cult shows a real cult.
- Branding: `public/og.svg` (VampireFreaks "Revival" wordmark) and `public/favicon.svg`, wired via head meta (og:image, twitter, icon); "created by hack.build" footer credit linking https://hack.build.
- README rewritten for vampirefreaks.net in plain voice (no emojis, em dashes, or marketing language).
- Tests: e2e for cult member-management authorization (owner-only promote/demote, mods can't remove mods, memberCount honest) and journal owner-only edit/delete. 58 unit/component pass; CI green; deployed and verified (favicon/og 200, footer credit live).
- Deferred from the audits (noted, not yet done): full UiCard -> VfPanel unification, lightbox focus-trap + close button, rating-widget radiogroup/keyboard, extracting detectImage/SigV4 for unit tests, a PNG OG image (SVG renders in many contexts but Facebook/Twitter prefer PNG), and the bands/music feature.

### Phases remaining

- Phase 2 media: photo galleries on Spaces (presigned uploads, thumbnails, EXIF strip). Schema in place. `/[username]/gallery` and PICS nav still point at stubs/profile.
- Phase 3 community: site forum DONE. Still to do: cults (browse/create/join/page + cult-scoped boards via the unified mechanism), roles/join policies, reporting queue, block/unblock routes (enforcement reads already exist), admin moderation UI, and making a staff account (set user.role=admin). The age-gate minor-protection from PRD 12 (locked-down messaging/discoverability for under-18) is collected but not yet enforced.
- Phase 4 music/events: band pages, song uploads, profile music player, events + RSVPs. Schema + stubs in place.
- Phase 5: sandboxed freeform-HTML profiles behind the age gate.
