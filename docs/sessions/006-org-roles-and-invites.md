# 006 - member roles and received invitations

## What was done

Finished the organization management surface: role editing, received-invitation handling, and gating controls by the caller's role. Built test-first.

### Audit fix

- `OrgMembers` showed the invite, remove, and (new) role controls to every member, but the API 403s anyone who is not an owner or admin. The component now reads the caller's role from the cached session and shows management controls only to owners and admins. The server still enforces it; this stops the UI from offering actions that fail.

### Features

- Per-member role dropdown backed by `updateMemberRole`. Owner rows are not editable; non-owner members can be moved between member and admin by a manager.
- `MyInvitations` component: lists invitations the signed-in user has received across organizations (with the organization name), accept or decline in-app through `acceptInvitation` and `rejectInvitation`. Shown at the top of `/organizations`; accepting refreshes the org list.

### Test-first

- Added e2e for the two API contracts the UI depends on before wiring the UI: promoting an accepted member to admin (`update-member-role`), and listing a pending invitation for the invited user (`list-user-invitations`). Both green. 8 e2e total.
- Typecheck caught two real issues during the build: the `role` argument is a role union (not `string`), and the select's change payload is `string | undefined`. Both fixed at the call sites.

### Verification

- `npm run test`: 28 passed. `npm run test:e2e` with Postgres: 8 passed. Gates clean: format, lint, typecheck, build.

## Open questions

- Leaving an organization (the `leave` endpoint) has no UI. Low priority; a member can be removed by an admin.
- The received-invitations list polls on mount only; it does not live-update if an invite arrives while the page is open.

## Next steps

- The organization primitives are now complete: create, switch active, invite, accept or decline, list and remove members, and change roles, all covered by e2e. This is a natural stopping point for the org work.
