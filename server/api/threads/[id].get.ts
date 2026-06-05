import { asc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { boards, posts, profiles, threads } from "../../db/schema"

// A thread with its board context and posts in order. Public read; posting is
// gated separately.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") ?? ""
  const [thread] = await db
    .select({
      id: threads.id,
      title: threads.title,
      pinned: threads.pinned,
      locked: threads.locked,
      postCount: threads.postCount,
      createdAt: threads.createdAt,
      boardSlug: boards.slug,
      boardName: boards.name,
    })
    .from(threads)
    .innerJoin(boards, eq(boards.id, threads.boardId))
    .where(eq(threads.id, id))
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such thread" })

  const postRows = await db
    .select({
      id: posts.id,
      body: posts.body,
      createdAt: posts.createdAt,
      editedAt: posts.editedAt,
      username: profiles.username,
      displayName: profiles.displayName,
    })
    .from(posts)
    .innerJoin(profiles, eq(profiles.userId, posts.userId))
    .where(eq(posts.threadId, id))
    .orderBy(asc(posts.createdAt))
    .limit(500)

  return { ...thread, posts: postRows }
})
