import { db } from "../../db/client"
import { journals } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"

// Write a journal entry. visibility gates who can read it later: public,
// friends, or private.
const VISIBILITY = new Set(["public", "friends", "private"])

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `journal:${userId}`, 20, 60_000)

  const body = await readBody<{
    title?: unknown
    body?: unknown
    mood?: unknown
    visibility?: unknown
  }>(event)
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!title) throw createError({ statusCode: 400, statusMessage: "A title is required" })
  if (title.length > 200) throw createError({ statusCode: 400, statusMessage: "Title is too long" })

  const text = typeof body?.body === "string" ? body.body.slice(0, 50000) : ""
  const mood = typeof body?.mood === "string" ? body.mood.trim().slice(0, 40) || null : null
  const visibility =
    typeof body?.visibility === "string" && VISIBILITY.has(body.visibility)
      ? body.visibility
      : "public"

  const [created] = await db
    .insert(journals)
    .values({ userId, title, body: text, mood, visibility })
    .returning()
  setResponseStatus(event, 201)
  return created
})
