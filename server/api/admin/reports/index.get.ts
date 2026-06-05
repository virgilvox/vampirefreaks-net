import { desc, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { profiles, reports } from "../../../db/schema"
import { requireAdmin } from "../../../utils/session"

// The open moderation queue, newest first. Staff only. Each row carries the
// snapshot label and link and the reporter's handle.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      targetLabel: reports.targetLabel,
      targetHref: reports.targetHref,
      reason: reports.reason,
      createdAt: reports.createdAt,
      reporterUsername: profiles.username,
    })
    .from(reports)
    .leftJoin(profiles, eq(profiles.userId, reports.reporterId))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(200)
})
