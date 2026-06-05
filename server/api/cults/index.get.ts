import { desc } from "drizzle-orm"
import { db } from "../../db/client"
import { cults } from "../../db/schema"

// Browse cults, most-populous first. Public read.
export default defineEventHandler(async () => {
  return db
    .select({
      slug: cults.slug,
      name: cults.name,
      description: cults.description,
      memberCount: cults.memberCount,
      joinPolicy: cults.joinPolicy,
    })
    .from(cults)
    .orderBy(desc(cults.memberCount), desc(cults.createdAt))
    .limit(60)
})
