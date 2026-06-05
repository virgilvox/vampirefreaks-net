import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { events } from "../../db/schema"
import { requireUser } from "../../utils/session"
import { safeHttpUrl } from "./index.post"

// Edit an event. The creator or staff only.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, "id") ?? ""
  const [existing] = await db
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, id))
  if (!existing) throw createError({ statusCode: 404, statusMessage: "No such event" })
  if (existing.creatorId !== user.id && (user as { role?: string }).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Not yours to edit" })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const patch: Record<string, unknown> = {}
  if (typeof body.title === "string") {
    const t = body.title.trim()
    if (!t) throw createError({ statusCode: 400, statusMessage: "A title is required" })
    patch.title = t.slice(0, 200)
  }
  if (typeof body.description === "string") patch.description = body.description.slice(0, 10000)
  for (const key of ["venue", "city"] as const) {
    if (body[key] === null) patch[key] = null
    else if (typeof body[key] === "string") patch[key] = body[key].trim().slice(0, 200) || null
  }
  if (body.url === null) patch.url = null
  else if (typeof body.url === "string") patch.url = safeHttpUrl(body.url)
  for (const key of ["startsAt", "endsAt"] as const) {
    if (typeof body[key] === "string" && body[key]) {
      const d = new Date(body[key] as string)
      if (!Number.isNaN(d.getTime())) patch[key] = d
    } else if (body[key] === null && key === "endsAt") {
      patch.endsAt = null
    }
  }
  if (
    patch.startsAt instanceof Date &&
    patch.endsAt instanceof Date &&
    patch.endsAt < patch.startsAt
  ) {
    throw createError({ statusCode: 400, statusMessage: "The end is before the start" })
  }
  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" })
  }

  const [updated] = await db.update(events).set(patch).where(eq(events.id, id)).returning()
  return updated
})
