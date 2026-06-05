import type { H3Event } from "h3"
import { auth, type SessionUser } from "../auth"

// Guard for API routes. Returns the signed-in user or throws 401, so a handler
// can start its first line with `const user = await requireUser(event)`.
//
// A ban is enforced here as well as at sign-in. better-auth blocks a banned
// user from creating a session, and banUser revokes existing ones, but
// getSession does not re-check the flag on later requests. This is the app's own
// backstop: a still-live session for a banned account gets no write access.
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const headers = event.headers
  const result = await auth.api.getSession({ headers })
  if (!result?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
  }
  const u = result.user as { banned?: boolean | null; banExpires?: Date | string | null }
  if (u.banned && (!u.banExpires || new Date(u.banExpires) > new Date())) {
    throw createError({ statusCode: 403, statusMessage: "Account suspended" })
  }
  return result.user
}

// The signed-in user or null, without throwing. Public reads use this to tailor
// a response (the viewer's own rating, friend state) while staying readable to
// logged-out visitors.
export async function optionalUser(event: H3Event): Promise<SessionUser | null> {
  const result = await auth.api.getSession({ headers: event.headers })
  return result?.user ?? null
}

// Staff gate. Throws 403 for a non-admin, so a moderation handler can start with
// `const user = await requireAdmin(event)`.
export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await requireUser(event)
  if ((user as { role?: string }).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Staff only" })
  }
  return user
}
