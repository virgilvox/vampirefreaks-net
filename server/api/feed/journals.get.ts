import { desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { journals, profiles } from "../../db/schema"

// Recent public journals across the site, for the homepage feed. Only public
// entries surface here; friends-only and private never leave the author's
// circle.
export default defineEventHandler(async () => {
  return db
    .select({
      id: journals.id,
      title: journals.title,
      body: journals.body,
      mood: journals.mood,
      commentCount: journals.commentCount,
      createdAt: journals.createdAt,
      username: profiles.username,
      displayName: profiles.displayName,
    })
    .from(journals)
    .innerJoin(profiles, eq(profiles.userId, journals.userId))
    .where(eq(journals.visibility, "public"))
    .orderBy(desc(journals.createdAt))
    .limit(15)
})
