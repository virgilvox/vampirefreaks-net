import { desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { profiles, statusUpdates } from "../../db/schema"

// Recent status updates across the site, the post-into-it stream that ran down
// the era's homepage. Recency-ordered, no algorithm.
export default defineEventHandler(async () => {
  return db
    .select({
      id: statusUpdates.id,
      body: statusUpdates.body,
      createdAt: statusUpdates.createdAt,
      username: profiles.username,
      displayName: profiles.displayName,
    })
    .from(statusUpdates)
    .innerJoin(profiles, eq(profiles.userId, statusUpdates.userId))
    .orderBy(desc(statusUpdates.createdAt))
    .limit(20)
})
