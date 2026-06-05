# 002 - audit and passkeys

## What was done

Audited the v0 scaffold against runtime behavior, fixed what the build could not catch, then added passkeys.

### Audit fixes

- Shadow theming was broken. Tailwind v4 inlines `--shadow-*` theme values into its shadow composition, so theme overrides of `--shadow-block` did nothing. Moved `--shadow-block` out of `@theme` into a plain `:root` custom property and exposed it through `@utility shadow-block`. Verified in the built CSS that `.shadow-block` now reads `var(--shadow-block)` and all four theme values emit.
- Reka Select rejects an empty-string item value. The dashboard "None" category used `value=""`, which throws at runtime. Switched to a `"none"` sentinel mapped back to null on save.
- Verified the auth schema against `better-auth generate` field for field. Added the indexes its generator recommends (`session.user_id`, `account.user_id`, `verification.identifier`) plus `$onUpdate` on every `updatedAt`, and indexed the example tables.
- `drizzle.config.ts` now loads `.env`, so `db:generate`, `db:migrate`, `db:push`, and `db:studio` use the same database the app does.
- Added `<html lang>` for WCAG.
- Wired `sendResetPassword` to a dev email transport (`server/auth/email.ts`) that logs the link. The forgot and reset flow works locally now instead of erroring. Replace the transport with a real sender before production.

### Passkeys (v0.1)

- Added the `@better-auth/passkey` plugin (separate package in better-auth 1.6) on the server, with `rpID` derived from the base URL hostname.
- Added `passkeyClient()` to the auth client.
- Added the `passkey` table to the schema, shape taken from the generator.
- Login page gained a sign-in-with-passkey button. New `/account` page registers, lists, and removes passkeys, linked from the user menu.

### Runtime verification

Booted the built server against a real Postgres in Docker and confirmed end to end:

- Landing renders with `data-theme="punk-zine"`.
- `/dashboard` redirects to `/login` when logged out, renders when signed in.
- Sign up writes a user, the session reads back through `/api/me`.
- Notes create returns 201 and persists, list returns it, unauthenticated write is 401.
- Passkey `generate-register-options` returns valid WebAuthn options (`rp.id: localhost`), `list-user-passkeys` returns `[]`.

All gates clean: format, lint, typecheck, test, build. Migration regenerated as a single file with all 8 tables and their indexes.

## Open questions

- Email is still a dev transport. Pick a provider (Resend, Postmark, SES, SMTP) and swap `sendEmail` before turning on email verification.

## Next steps

- v0.1 remaining: email verification page and delivery once a provider is chosen.
- v0.2: org and multi-tenant primitives, a deploy recipe.
