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
