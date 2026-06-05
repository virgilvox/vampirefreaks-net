import { desc, eq, gt, sql } from "drizzle-orm"
import { db } from "../db/client"
import { cults, journals, profiles, session } from "../db/schema"

// One read that fills the persistent shell: the freak count and the online
// count for the top bar, and the right rails (top cults, recent journals,
// newest members). Cheap aggregate reads, cached briefly by the layout fetch.
export default defineEventHandler(async () => {
  const now = new Date()

  const [[members], [online], topCults, topJournals, newest] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(profiles),
    db
      .select({ n: sql<number>`count(distinct ${session.userId})::int` })
      .from(session)
      .where(gt(session.expiresAt, now)),
    db
      .select({ slug: cults.slug, name: cults.name, memberCount: cults.memberCount })
      .from(cults)
      .orderBy(desc(cults.memberCount))
      .limit(8),
    db
      .select({
        id: journals.id,
        title: journals.title,
        username: profiles.username,
      })
      .from(journals)
      .innerJoin(profiles, eq(profiles.userId, journals.userId))
      .where(eq(journals.visibility, "public"))
      .orderBy(desc(journals.createdAt))
      .limit(8),
    db
      .select({ username: profiles.username, displayName: profiles.displayName })
      .from(profiles)
      .orderBy(desc(profiles.createdAt))
      .limit(8),
  ])

  return {
    stats: { members: members?.n ?? 0, online: online?.n ?? 0 },
    topCults,
    topJournals,
    newest,
  }
})
