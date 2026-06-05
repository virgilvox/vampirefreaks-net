import type { H3Event } from "h3"
import { auth, type SessionUser } from "../auth"

// Guard for API routes. Returns the signed-in user or throws 401, so a handler
// can start its first line with `const user = await requireUser(event)`.
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const headers = event.headers
  const result = await auth.api.getSession({ headers })
  if (!result?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
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
