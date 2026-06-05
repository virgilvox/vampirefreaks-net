// Which sign-in methods are actually wired, so the auth pages only offer what
// works. Mirrors server/auth socialProviders(): a provider is on only when both
// halves of its key pair are set. Email/password and passkeys need no external
// config, so they are always available. Returns booleans only, never the keys.
export default defineEventHandler(() => {
  const env = process.env
  return {
    emailPassword: true,
    passkey: true,
    github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  }
})
