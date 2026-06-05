import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { journals } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Edit an entry. Owner only, enforced by matching the row's userId.
const VISIBILITY = new Set(["public", "friends", "private"])

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""
  const body = await readBody<{
    title?: unknown
    body?: unknown
    mood?: unknown
    visibility?: unknown
  }>(event)

  const patch: Record<string, unknown> = {}
  if (typeof body?.title === "string") {
    const t = body.title.trim()
    if (!t) throw createError({ statusCode: 400, statusMessage: "A title is required" })
    patch.title = t.slice(0, 200)
  }
  if (typeof body?.body === "string") patch.body = body.body.slice(0, 50000)
  if (body?.mood === null) patch.mood = null
  else if (typeof body?.mood === "string") patch.mood = body.mood.trim().slice(0, 40) || null
  if (typeof body?.visibility === "string" && VISIBILITY.has(body.visibility))
    patch.visibility = body.visibility

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" })
  }

  const [updated] = await db
    .update(journals)
    .set(patch)
    .where(and(eq(journals.id, id), eq(journals.userId, userId)))
    .returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: "No such entry" })
  return updated
})
