# vampirefreaks.net handoff

A revival of the VampireFreaks social network era (2003 to 2008), built on the JIG
stack and live at https://vampirefreaks.net. Per-session detail lives in
`docs/sessions/`. This file is the standing snapshot: what works, how to run it,
how it deploys, and what is left.

## Status

Live and green on `main`. Built so far: the full identity and social loop, journals,
status/activity, the site forum, and cults. CI (lint, typecheck, unit/component,
build, e2e against real Postgres) passes on every push; the image is built in CI and
the droplet pulls it.

## What works

Auth (better-auth on a Nitro catch-all):

- Email and password; password reset and email verification through Resend (console
  fallback in dev). Verification is off until Resend is configured.
- GitHub and Google OAuth switch on only when their keys are set. The login page asks
  `/api/auth-providers` and shows only the methods that actually work.
- Passkeys (WebAuthn): manage on `/account`, sign in on `/login`.
- Admin plugin: staff `role` on the user table, used by the `requireAdmin` gate and the
  `admin` route middleware. No paid tiers, no premium; moderation applies to everyone.

The social network (Postgres via Drizzle, schema as code):

- Profiles and onboarding: claim a username, structured customization (colors, font,
  background, bounded sanitized custom CSS), the public `/[username]` page.
- Rating: 1 to 10 peer rating with denormalized aggregates, leaderboards (`/top`) with a
  five-rating floor, opt-out that hides the number.
- Friends: request, accept, decline, remove; mutual-request auto-accept.
- Messages: private inbox, sent box, read receipts; block-aware.
- Journals: create/edit/delete, public/friends/private visibility enforced server-side,
  comments with a synced counter, the recent feed.
- Status updates feeding the homepage activity stream.
- Forum: site message boards, threads, posts, locked/pinned, staff pin/lock with an
  audit-log entry.
- Cults: browse, create, join (open/approval/closed), leave, owner/mod management
  (approve, promote/demote, remove), member roster, member count.
- Blocking: block/unblock cuts messaging, rating, commenting, and friend requests both
  ways and clears any friendship.
- Photo galleries: upload to Spaces, set a photo as the avatar, caption, delete, lightbox.
  The first upload becomes the avatar automatically, and the profile editor has its own
  avatar upload. Avatars render on the profile header, the leaderboards, the homepage
  panels, the featured member, and the friends grid.
- Events: members post events (title, start, end, venue, city, link, details); the listing
  splits upcoming from past and filters by city; the detail page takes going/interested
  RSVPs; the creator or staff can delete.
- Music: members upload audio tracks (sniffed, stored in Spaces), set one as their profile
  song (played on the profile with no autoplay), and propose band pages that go public only
  after staff approval, with the owner attaching their own tracks.
- The shell: the early-2000s VampireFreaks 3-column layout (blackletter wordmark, live
  FREAK COUNT and online count, dense magenta nav, left member sidebar, center content,
  right Top Cults / Top Journals / Newest rails) and the oversaturated homepage.

Design system:

- Flat token contract in `app/assets/design/tokens.css`; the `crypt` theme
  (`app/assets/design/themes/crypt.css`) is the only one that matters and is the default.
  No theme switcher. Zero hardcoded colors in components; chrome accents are tokens.

## Run it locally

```bash
cp .env.example .env          # set BETTER_AUTH_SECRET; SPACES_* optional until media lands
npm install
docker compose up -d db       # needs a working Docker daemon
npm run db:migrate
npm run db:seed               # seeds only the forum boards, no fake accounts
npm run dev                   # http://localhost:3000
```

Sign up, claim a username at `/onboarding`, then explore. The seed creates the four
forum boards and nothing else, so every account and post is real.

## Tests

- `npm run test`: unit (`test/unit`) and component (`test/components`), no infrastructure.
  67 tests.
- `npm run test:e2e`: boots the real server against real Postgres, applies the migration,
  and exercises the social loop, journals, forum, cults, blocking, and org primitives.
  Run with a database up: `docker compose up -d db`, then
  `DATABASE_URL=... BETTER_AUTH_SECRET=... DISABLE_RATE_LIMIT=true npm run test:e2e`.
- CI (`.github/workflows/ci.yml`) runs all of the above on every push.

## Deploy (live)

Architecture: a small DigitalOcean droplet runs the app via docker compose; the image is
built in GitHub Actions and pushed to the DO container registry; Postgres runs on the
droplet with its data on an attached block-storage volume; Caddy terminates TLS. Full
detail in `deploy/README.md` and `docs/sessions/001-...`.

- Droplet `vampirefreaks` (sfo3, s-1vcpu-1gb), project lumen. Volume `vfdata` at
  `/mnt/vfdata`. Stack in `/opt/vf/docker-compose.prod.yml`.
- Image build: `.github/workflows/deploy.yml` on push to `main` pushes
  `ghcr.io/virgilvox/vampirefreaks-net:latest` with the built-in `GITHUB_TOKEN`. The repo
  is public so the package is public; the droplet pulls it without credentials. (We moved
  off the DO registry after it hit its storage quota.)
- Redeploy: `git push` (CI rebuilds), then on the droplet
  `cd /opt/vf && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml run --rm migrate && docker compose -f docker-compose.prod.yml up -d`.
  SSH as `root@<droplet-ip>` (the account's deploy keys are authorized).
- New migrations ship inside the image and apply via the one-shot `migrate` service on
  redeploy.

## Environment

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`,
`GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`,
`REQUIRE_EMAIL_VERIFICATION`, `SPACES_KEY/SECRET/BUCKET/REGION/ENDPOINT`, `SPACES_CDN_BASE`.
`DISABLE_RATE_LIMIT` is test-only. See `.env.example`.

## Security notes

- Member custom CSS is sanitized on write (`server/utils/sanitize.ts`): at-rules are
  stripped (so nothing escapes the per-profile scope), `position:fixed/sticky` removed
  (no clickjacking overlay), url() allowlisted to the media CDN and raster data URIs, and
  the ProfileBody container clips and isolates. Freeform HTML profiles (PRD Phase 5) are
  still deferred to a separate-origin sandbox and are not rendered.
- Blocks are enforced on messaging, rating, commenting, and friend requests.
- Photo uploads go server to Spaces with a hand-rolled SigV4 PUT (no AWS SDK), using a
  bucket-scoped Spaces key in the droplet env. The upload sniffs the real image magic bytes
  and derives the stored type from them, so the client content-type cannot smuggle a
  non-image; objects store one of four image types. The image package on GHCR is public, so
  no registry credentials sit on the droplet.
- A ban is enforced in the app's own auth gate (`requireUser`), not just at sign-in, so a
  still-live session for a banned account gets no write access.
- Security headers ship on every response: nosniff, X-Frame-Options SAMEORIGIN,
  Referrer-Policy, and a Content-Security-Policy. The CSP blocks off-origin scripts, plugins
  (object-src none), base-tag and form-action redirection, and third-party framing. Inline
  script stays allowed because Nuxt's hydration payload is inline, and inline style stays
  allowed for the sanitized profile customization. Tightening script-src to a nonce is the
  next pass.
- The structured profile background image runs through the same CDN/relative/data-image
  allowlist as the freeform CSS, so a profile cannot beacon to an arbitrary host on view.

## Known gaps and next steps

- Photo galleries are live on Spaces (upload, set-as-avatar, delete, lightbox), and the
  avatar shows on the profile header. Still to do: EXIF stripping, thumbnails, photo
  ratings, and reaping deleted objects from the bucket.
- Phase 4 is done (events and music/bands). Smaller follow-ups: event flyer images, an
  upcoming-events panel on the homepage, band/song deletion reaping Spaces objects, EXIF
  stripping and thumbnails for photos, and photo ratings.
- Phase 5 (sandboxed freeform-HTML profiles behind the age gate) is the last PRD phase and
  is not started; the structured customization path covers v1.
- Counter drift: a target's rating average is not adjusted when a rater's account is
  deleted (the rating row cascades away but ratingSum/ratingCount do not), and
  journals.commentCount / threads.postCount only increment. Recompute or add decrement
  paths when content/account deletion needs exact counts.
- Other deferred audit items: full UiCard to VfPanel unification, a nonce-based CSP
  script-src, cult-scoped forum boards, photo EXIF stripping and thumbnails, reaping
  deleted Spaces objects, and enforcing the under-18 messaging restrictions.
- Moderation is built: members report profiles/journals/posts/cults, staff work the
  queue at `/admin` (resolve, dismiss, remove, ban), all audit-logged. Make the first
  moderator with `npm run admin:grant -- <email>`. Still open: report controls on
  messages and events, and surfacing each member's report history.
- Cult-scoped forum boards: the unified `boards` mechanism supports `scope=cult` with a
  `cultId`, but cults do not yet create or surface their own boards.
- Age gate: birthdate and an adult-or-not flag are collected at onboarding but the
  stricter under-18 protections (locked-down messaging, limited discoverability) from PRD
  section 12 are not yet enforced.
- Denormalized counters (`journals.commentCount`, `threads.postCount`) only increment;
  they do not decrement on a cascade delete of a commenting/posting user. Low frequency;
  switch to count-on-read or add decrement paths when content deletion lands.
- Rate limiting is per-process in memory; move to a shared store if running more than one
  instance.
- Email delivery needs a verified Resend domain before it reaches anyone but the account
  owner.
