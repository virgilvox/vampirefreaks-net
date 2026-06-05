import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { events } from "../../db/schema"
import { requireUser } from "../../utils/session"
import { enforceRateLimit } from "../../utils/rate-limit"

// Delete an event. The creator or staff only. RSVPs cascade via the schema.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  enforceRateLimit(event, `event-edit:${user.id}`, 20, 60_000)
  const id = getRouterParam(event, "id") ?? ""
  const [existing] = await db
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, id))
  if (!existing) throw createError({ statusCode: 404, statusMessage: "No such event" })
  if (existing.creatorId !== user.id && (user as { role?: string }).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Not yours to delete" })
  }
  await db.delete(events).where(eq(events.id, id))
  return { ok: true }
})
