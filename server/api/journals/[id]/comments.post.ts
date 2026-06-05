import { eq, sql } from "drizzle-orm"
import { db } from "../../../db/client"
import { journalComments, journals } from "../../../db/schema"
import { requireProfile } from "../../../utils/profile"
import { canView, isBlocked } from "../../../utils/friends"
import { enforceRateLimit } from "../../../utils/rate-limit"

// Comment on an entry the member is allowed to see. The insert and the entry's
// comment counter move together so the count never drifts.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `comment:${userId}`, 40, 60_000)

  const id = getRouterParam(event, "id") ?? ""
  const body = await readBody<{ body?: unknown }>(event)
  const text = typeof body?.body === "string" ? body.body.trim() : ""
  if (!text) throw createError({ statusCode: 400, statusMessage: "Say something first" })
  if (text.length > 5000)
    throw createError({ statusCode: 400, statusMessage: "Comment is too long" })

  const [entry] = await db
    .select({ userId: journals.userId, visibility: journals.visibility })
    .from(journals)
    .where(eq(journals.id, id))
  if (!entry) throw createError({ statusCode: 404, statusMessage: "No such entry" })
  if (!(await canView(entry.visibility, entry.userId, userId))) {
    throw createError({ statusCode: 404, statusMessage: "No such entry" })
  }
  if (await isBlocked(userId, entry.userId)) {
    throw createError({ statusCode: 403, statusMessage: "Unavailable" })
  }

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(journalComments)
      .values({ journalId: id, userId, body: text })
      .returning()
    await tx
      .update(journals)
      .set({ commentCount: sql`${journals.commentCount} + 1` })
      .where(eq(journals.id, id))
    return row
  })

  setResponseStatus(event, 201)
  return created
})
