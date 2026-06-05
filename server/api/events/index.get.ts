import { and, asc, desc, eq, sql } from "drizzle-orm"
import { db } from "../../db/client"
import { eventRsvps, events, profiles } from "../../db/schema"

// Event listings split into upcoming (soonest first) and past (most recent
// first), so past events drop below upcoming. Optional ?city filter narrows
// both. Each row carries the going count and the creator handle.
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const city = typeof q.city === "string" && q.city.trim() ? q.city.trim() : null
  const now = new Date()

  const goingCount = sql<number>`(select count(*)::int from ${eventRsvps} where ${eventRsvps.eventId} = ${events.id} and ${eventRsvps.status} = 'going')`
  const cols = {
    id: events.id,
    title: events.title,
    venue: events.venue,
    city: events.city,
    startsAt: events.startsAt,
    endsAt: events.endsAt,
    url: events.url,
    creatorUsername: profiles.username,
    goingCount,
  }

  const cityFilter = city ? eq(events.city, city) : undefined
  // An event counts as upcoming until it ends, so something happening right now
  // stays at the top instead of dropping into past the moment it starts.
  const endRef = sql`coalesce(${events.endsAt}, ${events.startsAt})`

  const upcoming = await db
    .select(cols)
    .from(events)
    .leftJoin(profiles, eq(profiles.userId, events.creatorId))
    .where(and(sql`${endRef} >= ${now}`, cityFilter))
    .orderBy(asc(events.startsAt))
    .limit(100)

  const past = await db
    .select(cols)
    .from(events)
    .leftJoin(profiles, eq(profiles.userId, events.creatorId))
    .where(and(sql`${endRef} < ${now}`, cityFilter))
    .orderBy(desc(events.startsAt))
    .limit(50)

  return { upcoming, past }
})
