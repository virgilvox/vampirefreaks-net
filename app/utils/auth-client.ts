import { createAuthClient } from "better-auth/vue"
import { organizationClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

// The browser-side counterpart to server/auth. Talks to /api/auth/* for the
// mutations (sign in, sign up, sign out, reset, passkeys, organizations). Reads
// of the current session go through /api/me so they render on the server.
// Auto-imported by Nuxt.
export const authClient = createAuthClient({
  plugins: [passkeyClient(), organizationClient()],
})
