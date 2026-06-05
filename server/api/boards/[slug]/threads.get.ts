import { and, desc, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { boards, profiles, threads } from "../../../db/schema"

// Threads in a site board, pinned first, then most recent activity. Each row
// carries the starter's handle and the counts the list shows. The board itself
// is returned so the page can show its name and description.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") ?? ""
  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.scope, "site"), eq(boards.slug, slug)))
  if (!board) throw createError({ statusCode: 404, statusMessage: "No such board" })

  const rows = await db
    .select({
      id: threads.id,
      title: threads.title,
      pinned: threads.pinned,
      locked: threads.locked,
      postCount: threads.postCount,
      lastPostAt: threads.lastPostAt,
      createdAt: threads.createdAt,
      username: profiles.username,
      displayName: profiles.displayName,
    })
    .from(threads)
    .innerJoin(profiles, eq(profiles.userId, threads.userId))
    .where(eq(threads.boardId, board.id))
    .orderBy(desc(threads.pinned), desc(threads.lastPostAt))
    .limit(100)

  return {
    board: { name: board.name, slug: board.slug, description: board.description },
    threads: rows,
  }
})
