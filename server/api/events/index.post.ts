import { db } from "../../db/client"
import { events } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"

// Post an event. startsAt is required; the rest are optional. The creator owns
// it for later edits.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `event:${userId}`, 15, 60_000)

  const body = await readBody<{
    title?: unknown
    description?: unknown
    venue?: unknown
    city?: unknown
    startsAt?: unknown
    endsAt?: unknown
    url?: unknown
  }>(event)

  const title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!title) throw createError({ statusCode: 400, statusMessage: "A title is required" })
  if (title.length > 200) throw createError({ statusCode: 400, statusMessage: "Title is too long" })

  const startsAt = parseDate(body?.startsAt)
  if (!startsAt)
    throw createError({ statusCode: 400, statusMessage: "A valid start date is required" })
  const endsAt = parseDate(body?.endsAt)
  if (endsAt && endsAt < startsAt) {
    throw createError({ statusCode: 400, statusMessage: "The end is before the start" })
  }

  const str = (v: unknown, max: number): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null

  const [created] = await db
    .insert(events)
    .values({
      creatorId: userId,
      title,
      description: typeof body?.description === "string" ? body.description.slice(0, 10000) : "",
      venue: str(body?.venue, 200),
      city: str(body?.city, 120),
      startsAt,
      endsAt,
      url: safeHttpUrl(body?.url),
    })
    .returning()
  setResponseStatus(event, 201)
  return created
})

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// Accept only http(s) links, so a stored url cannot become a javascript: or
// data: vector when rendered as an anchor on the event page.
export function safeHttpUrl(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null
  try {
    const u = new URL(v.trim())
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString().slice(0, 500) : null
  } catch {
    return null
  }
}
