import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { boards, posts, threads } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"

// Start a thread in a site board. The thread and its opening post are written
// together, with postCount seeded at 1 and lastPostAt now, so the board list is
// correct the moment the thread exists.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `thread:${userId}`, 15, 60_000)

  const body = await readBody<{ boardSlug?: unknown; title?: unknown; body?: unknown }>(event)
  const boardSlug = typeof body?.boardSlug === "string" ? body.boardSlug : ""
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  const text = typeof body?.body === "string" ? body.body.trim() : ""
  if (!title) throw createError({ statusCode: 400, statusMessage: "A title is required" })
  if (title.length > 200) throw createError({ statusCode: 400, statusMessage: "Title is too long" })
  if (!text) throw createError({ statusCode: 400, statusMessage: "Write the first post" })

  const [board] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.scope, "site"), eq(boards.slug, boardSlug)))
  if (!board) throw createError({ statusCode: 404, statusMessage: "No such board" })

  const thread = await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(threads)
      .values({ boardId: board.id, userId, title, postCount: 1 })
      .returning()
    if (!t) throw createError({ statusCode: 500, statusMessage: "Could not create thread" })
    await tx.insert(posts).values({ threadId: t.id, userId, body: text })
    return t
  })

  setResponseStatus(event, 201)
  return { id: thread.id, boardSlug }
})
