import { asc, eq, sql } from "drizzle-orm"
import { db } from "../../db/client"
import { boards, threads } from "../../db/schema"

// The site forum board index: every site-scoped board with its thread count,
// ordered the way staff arranged them. Cult boards (scope cult) are listed on
// their cult page, not here.
export default defineEventHandler(async () => {
  return db
    .select({
      id: boards.id,
      name: boards.name,
      slug: boards.slug,
      description: boards.description,
      threadCount: sql<number>`(select count(*)::int from ${threads} where ${threads.boardId} = ${boards.id})`,
    })
    .from(boards)
    .where(eq(boards.scope, "site"))
    .orderBy(asc(boards.sortOrder))
})
