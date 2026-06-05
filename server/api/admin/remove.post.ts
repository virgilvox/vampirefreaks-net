import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "../../db/client"
import { auditLog, cults, journals, posts, reports, threads } from "../../db/schema"
import { requireAdmin } from "../../utils/session"

// Staff removal of reported content. Deletes the item, keeps thread counts
// correct, resolves the open reports against it (and against a removed thread's
// posts), and records the action. Banning a member is a separate action through
// the better-auth admin endpoints.
const REMOVABLE = new Set(["journal", "post", "cult", "thread"])

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<{ targetType?: unknown; targetId?: unknown }>(event)
  const targetType = typeof body?.targetType === "string" ? body.targetType : ""
  const targetId = typeof body?.targetId === "string" ? body.targetId : ""
  if (!REMOVABLE.has(targetType)) {
    throw createError({ statusCode: 400, statusMessage: "Cannot remove that" })
  }

  await db.transaction(async (tx) => {
    let removedPostIds: string[] = []

    if (targetType === "journal") {
      const gone = await tx
        .delete(journals)
        .where(eq(journals.id, targetId))
        .returning({ id: journals.id })
      if (gone.length === 0) throw createError({ statusCode: 404, statusMessage: "Already gone" })
    } else if (targetType === "post") {
      const [p] = await tx
        .select({ threadId: posts.threadId })
        .from(posts)
        .where(eq(posts.id, targetId))
      if (!p) throw createError({ statusCode: 404, statusMessage: "Already gone" })
      await tx.delete(posts).where(eq(posts.id, targetId))
      await tx
        .update(threads)
        .set({ postCount: sql`GREATEST(${threads.postCount} - 1, 0)` })
        .where(eq(threads.id, p.threadId))
    } else if (targetType === "thread") {
      // Capture the post ids before the cascade so their reports resolve too.
      removedPostIds = (
        await tx.select({ id: posts.id }).from(posts).where(eq(posts.threadId, targetId))
      ).map((r) => r.id)
      const gone = await tx
        .delete(threads)
        .where(eq(threads.id, targetId))
        .returning({ id: threads.id })
      if (gone.length === 0) throw createError({ statusCode: 404, statusMessage: "Already gone" })
    } else {
      const gone = await tx.delete(cults).where(eq(cults.id, targetId)).returning({ id: cults.id })
      if (gone.length === 0) throw createError({ statusCode: 404, statusMessage: "Already gone" })
    }

    await tx
      .update(reports)
      .set({ status: "resolved", handledBy: admin.id })
      .where(
        and(
          eq(reports.targetType, targetType),
          eq(reports.targetId, targetId),
          eq(reports.status, "open"),
        ),
      )

    if (removedPostIds.length > 0) {
      await tx
        .update(reports)
        .set({ status: "resolved", handledBy: admin.id })
        .where(
          and(
            eq(reports.targetType, "post"),
            inArray(reports.targetId, removedPostIds),
            eq(reports.status, "open"),
          ),
        )
    }

    await tx.insert(auditLog).values({ actorId: admin.id, action: "remove", targetType, targetId })
  })

  return { ok: true }
})
