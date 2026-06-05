# 005 - organization members and invitations

## What was done

Completed the organization primitives into a usable feature: invite members, accept invitations, list and remove members, cancel pending invites. Built test-first.

### Test-first

- Wrote the e2e invite-and-accept test before the implementation. It failed with a 403 on accept.
- The cause was better-auth's `requireEmailVerificationOnInvitation`, which defaults to true: an invitee with an unverified email cannot accept. That is a sensible secure default, but inconsistent with this template, where email verification is off by default so a fresh clone works.
- Tied it to the same `REQUIRE_EMAIL_VERIFICATION` flag: invitations require a verified email only when verification is required overall. Wired `sendInvitationEmail` to the email transport at the same time. The test then passed.

### Server

- `organization()` now configures `sendInvitationEmail` (builds an `/accept-invitation?id=...` link through the email transport) and `requireEmailVerificationOnInvitation` from the verification flag.

### UI

- `app/components/OrgMembers.vue`: invite by email with a role, list members with their roles, remove non-owner members, list and cancel pending invitations. Self-contained, reads from the better-auth client.
- `/organizations` shows the members panel for the active organization.
- `app/pages/accept-invitation.vue`: where the invite link lands. Prompts an unauthenticated visitor to sign in, then accepts; the invitee's email must match the invitation.

### Tests

- e2e (`test/e2e`): added invite-member then accept-invitation across two users, asserting the org ends with two members. 6 e2e total.
- Unit and component suites unchanged at 28, still green.

### Verification

- `npm run test`: 28 passed. `npm run test:e2e` with Postgres up: 6 passed. Gates clean: format, lint, typecheck, build.

## Open questions

- Member role editing (promote and demote) has an endpoint but no UI yet. The remove and invite actions are wired; role changes are a small follow-on.
- Invitation emails only deliver once Resend is configured with a verified domain; the console transport logs the link in dev.

## Next steps

- Optional: a role dropdown per member backed by `updateMemberRole`, and a banner listing invitations the current user has received (`listUserInvitations`).
