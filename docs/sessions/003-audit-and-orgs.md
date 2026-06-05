# 003 - audit and organizations

## What was done

Audited the v0.1 additions, fixed what mattered, then built the v0.2 multi-tenant primitives and a deploy recipe.

### Audit fixes

- `/api/me` returned the full session object, including the session token, to client-readable JSON. That token is the bearer credential and weakens the httpOnly cookie if exposed. Changed the endpoint to return only `{ user }`. Confirmed at runtime that the response carries zero token occurrences.
- The login page sent unverified users into a dead-end error. It now reads the 403 and routes them to `/verify-email` to resend the link.
- Added a production guard: the server refuses to boot if `BETTER_AUTH_SECRET` is missing in production, instead of running with forgeable sessions.

### Organizations (v0.2)

- Added the better-auth `organization` plugin (core) on the server and `organizationClient()` on the client.
- Added the `organization`, `member`, and `invitation` tables plus the `session.active_organization_id` column, shapes taken from the generator.
- New `/organizations` page: create an organization (slug derived from the name), list the ones you belong to, and set the active one. Linked from the user menu.
- Kept it off the notes app's path. The primitives are available; tenancy is opt-in.

### Deploy recipe

- `docs/deploy.md`: env requirements, running migrations as a release step, Docker and bare-Node paths, and a checklist.

### Runtime verification

Against a real Postgres in Docker:

- `/api/me` returns `{ user }` only, no token.
- Org create returns the org and adds the creator as `owner`, list returns it, set-active sets `session.active_organization_id`. Verified the org and member rows in the database.
- The org write rejects requests with no `Origin` header (better-auth CSRF protection); browsers always send it.

All gates clean: format, lint, typecheck, test, build. Migration regenerated as a single file with all 10 tables.

## Open questions

- Member and invitation management has tables and endpoints but no UI yet. Add invite and role-management screens when a product needs them.
- Email is still configured for Resend but unverified-domain sends only reach the Resend account owner. Verify a domain before relying on delivery.

## Next steps

- Optional: invite-member and role UI on the organizations page.
- Optional: scope the example notes to the active organization to show the tenancy pattern end to end.
