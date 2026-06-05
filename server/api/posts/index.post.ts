import { eq, sql } from "drizzle-orm"
import { db } from "../../db/client"
import { posts, threads } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"

// Reply to a thread. A locked thread rejects new posts. The post insert and the
// thread's postCount and lastPostAt move together so the board ordering and
// counts stay correct.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `post:${userId}`, 40, 60_000)

  const body = await readBody<{ threadId?: unknown; body?: unknown }>(event)
  const threadId = typeof body?.threadId === "string" ? body.threadId : ""
  const text = typeof body?.body === "string" ? body.body.trim() : ""
  if (!text) throw createError({ statusCode: 400, statusMessage: "Write something first" })
  if (text.length > 20000) throw createError({ statusCode: 400, statusMessage: "Post is too long" })

  const [thread] = await db
    .select({ id: threads.id, locked: threads.locked })
    .from(threads)
    .where(eq(threads.id, threadId))
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such thread" })
  if (thread.locked) throw createError({ statusCode: 403, statusMessage: "This thread is locked" })

  const created = await db.transaction(async (tx) => {
    const [row] = await tx.insert(posts).values({ threadId, userId, body: text }).returning()
    await tx
      .update(threads)
      .set({ postCount: sql`${threads.postCount} + 1`, lastPostAt: new Date() })
      .where(eq(threads.id, threadId))
    return row
  })

  setResponseStatus(event, 201)
  return created
})
