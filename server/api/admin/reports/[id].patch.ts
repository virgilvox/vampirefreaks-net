import { and, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { auditLog, reports } from "../../../db/schema"
import { requireAdmin } from "../../../utils/session"

// Resolve or dismiss a report. Actioning one report clears every other open
// report against the same target too, so staff are not left clearing duplicates
// one at a time. Staff only, recorded in the audit log.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, "id") ?? ""
  const body = await readBody<{ status?: unknown }>(event)
  const status = body?.status
  if (status !== "resolved" && status !== "dismissed") {
    throw createError({ statusCode: 400, statusMessage: "status must be resolved or dismissed" })
  }

  const [report] = await db
    .select({ targetType: reports.targetType, targetId: reports.targetId })
    .from(reports)
    .where(eq(reports.id, id))
  if (!report) throw createError({ statusCode: 404, statusMessage: "No such report" })

  await db
    .update(reports)
    .set({ status, handledBy: admin.id })
    .where(
      and(
        eq(reports.targetType, report.targetType),
        eq(reports.targetId, report.targetId),
        eq(reports.status, "open"),
      ),
    )

  await db.insert(auditLog).values({
    actorId: admin.id,
    action: `report:${status}`,
    targetType: report.targetType,
    targetId: report.targetId,
  })
  return { ok: true }
})
