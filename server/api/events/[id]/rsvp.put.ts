import { and, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { eventRsvps, events } from "../../../db/schema"
import { requireProfile } from "../../../utils/profile"

// RSVP to an event: going, interested, or none (which clears the RSVP). One
// state per member per event, enforced by the unique index and an upsert.
const STATES = new Set(["going", "interested", "none"])

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""
  const body = await readBody<{ status?: unknown }>(event)
  const status = typeof body?.status === "string" ? body.status : ""
  if (!STATES.has(status)) throw createError({ statusCode: 400, statusMessage: "Unknown RSVP" })

  const [exists] = await db.select({ id: events.id }).from(events).where(eq(events.id, id))
  if (!exists) throw createError({ statusCode: 404, statusMessage: "No such event" })

  if (status === "none") {
    await db
      .delete(eventRsvps)
      .where(and(eq(eventRsvps.eventId, id), eq(eventRsvps.userId, userId)))
    return { status: "none" }
  }

  await db
    .insert(eventRsvps)
    .values({ eventId: id, userId, status })
    .onConflictDoUpdate({ target: [eventRsvps.eventId, eventRsvps.userId], set: { status } })
  return { status }
})
