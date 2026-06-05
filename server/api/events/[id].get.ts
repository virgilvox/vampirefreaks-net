import { and, eq, sql } from "drizzle-orm"
import { db } from "../../db/client"
import { eventRsvps, events, profiles } from "../../db/schema"
import { optionalUser } from "../../utils/session"

// A single event with its creator, going and interested counts, and the
// viewer's own RSVP when signed in.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") ?? ""
  const [row] = await db
    .select({
      id: events.id,
      creatorId: events.creatorId,
      title: events.title,
      description: events.description,
      venue: events.venue,
      city: events.city,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      url: events.url,
      createdAt: events.createdAt,
      creatorUsername: profiles.username,
      goingCount: sql<number>`(select count(*)::int from ${eventRsvps} where ${eventRsvps.eventId} = ${events.id} and ${eventRsvps.status} = 'going')`,
      interestedCount: sql<number>`(select count(*)::int from ${eventRsvps} where ${eventRsvps.eventId} = ${events.id} and ${eventRsvps.status} = 'interested')`,
    })
    .from(events)
    .leftJoin(profiles, eq(profiles.userId, events.creatorId))
    .where(eq(events.id, id))
  if (!row) throw createError({ statusCode: 404, statusMessage: "No such event" })

  const viewer = await optionalUser(event)
  let viewerRsvp: string | null = null
  if (viewer) {
    const [r] = await db
      .select({ status: eventRsvps.status })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, id), eq(eventRsvps.userId, viewer.id)))
    viewerRsvp = r?.status ?? null
  }
  const isEditor = Boolean(
    viewer && (viewer.id === row.creatorId || (viewer as { role?: string }).role === "admin"),
  )

  return { ...row, viewerRsvp, isEditor }
})
