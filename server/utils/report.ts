import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { boards, cults, journals, posts, profiles, threads } from "../db/schema"

export type ReportTarget = { label: string; href: string }

// The content types a member can report, and how each resolves to a readable
// label and a link for the moderation queue. Returns null when the target does
// not exist, so the report handler can reject a bad reference.
export async function resolveReportTarget(
  targetType: string,
  targetId: string,
): Promise<ReportTarget | null> {
  if (targetType === "profile") {
    const [p] = await db
      .select({ username: profiles.username })
      .from(profiles)
      .where(eq(profiles.userId, targetId))
    return p ? { label: `profile @${p.username}`, href: `/${p.username}` } : null
  }

  if (targetType === "journal") {
    const [j] = await db
      .select({ title: journals.title, username: profiles.username })
      .from(journals)
      .innerJoin(profiles, eq(profiles.userId, journals.userId))
      .where(eq(journals.id, targetId))
    return j ? { label: `journal: ${j.title}`, href: `/${j.username}/journal/${targetId}` } : null
  }

  if (targetType === "post") {
    const [row] = await db
      .select({ threadId: posts.threadId, boardSlug: boards.slug })
      .from(posts)
      .innerJoin(threads, eq(threads.id, posts.threadId))
      .innerJoin(boards, eq(boards.id, threads.boardId))
      .where(eq(posts.id, targetId))
    return row ? { label: "forum post", href: `/forum/${row.boardSlug}/${row.threadId}` } : null
  }

  if (targetType === "cult") {
    const [c] = await db
      .select({ name: cults.name, slug: cults.slug })
      .from(cults)
      .where(eq(cults.id, targetId))
    return c ? { label: `cult: ${c.name}`, href: `/cults/${c.slug}` } : null
  }

  return null
}
