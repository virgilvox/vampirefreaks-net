import { db } from "../db/client"
import { statusUpdates } from "../db/schema"
import { requireProfile } from "../utils/profile"
import { enforceRateLimit } from "../utils/rate-limit"

// The "Update Status" box. A short line that lands in the activity stream and on
// the member's profile. Rate limited like the other write paths.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `status:${userId}`, 30, 60_000)

  const body = await readBody<{ body?: unknown }>(event)
  const text = typeof body?.body === "string" ? body.body.trim() : ""
  if (!text) throw createError({ statusCode: 400, statusMessage: "Say something first" })
  if (text.length > 500)
    throw createError({ statusCode: 400, statusMessage: "Keep it under 500 characters" })

  const [created] = await db.insert(statusUpdates).values({ userId, body: text }).returning()
  setResponseStatus(event, 201)
  return created
})
