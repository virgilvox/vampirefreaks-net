// Username rules in one place. The handle is the public identity and the
// /[username] route, so it is lowercased for routing and kept clear of paths
// the app already owns.

// Routes and section names a username must never shadow.
const RESERVED = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "logout",
  "forgot-password",
  "reset-password",
  "verify-email",
  "onboarding",
  "account",
  "messages",
  "top",
  "cults",
  "forum",
  "bands",
  "events",
  "journals",
  "journal",
  "gallery",
  "organizations",
  "dashboard",
  "settings",
  "search",
  "about",
  "terms",
  "privacy",
  "guidelines",
  "faq",
  "help",
  "home",
  "me",
  "static",
  "_nuxt",
])

const PATTERN = /^[a-z0-9_]{3,20}$/

export type UsernameCheck = { ok: true; value: string } | { ok: false; reason: string }

// Normalize then validate. Returns the canonical lowercased handle or the
// reason it was rejected, so the caller can surface a precise message.
export function normalizeUsername(raw: unknown): UsernameCheck {
  if (typeof raw !== "string") return { ok: false, reason: "Username is required" }
  const value = raw.trim().toLowerCase()
  if (!value) return { ok: false, reason: "Username is required" }
  if (!PATTERN.test(value)) {
    return {
      ok: false,
      reason: "Use 3 to 20 characters: lowercase letters, numbers, or underscore",
    }
  }
  if (RESERVED.has(value)) return { ok: false, reason: "That username is reserved" }
  return { ok: true, value }
}
