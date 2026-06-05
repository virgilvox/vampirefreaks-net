import { eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { auditLog, reports } from "../../../db/schema"
import { requireAdmin } from "../../../utils/session"

// Resolve or dismiss a report. Staff only, recorded in the audit log.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, "id") ?? ""
  const body = await readBody<{ status?: unknown }>(event)
  const status = body?.status
  if (status !== "resolved" && status !== "dismissed") {
    throw createError({ statusCode: 400, statusMessage: "status must be resolved or dismissed" })
  }

  const [updated] = await db
    .update(reports)
    .set({ status, handledBy: admin.id })
    .where(eq(reports.id, id))
    .returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: "No such report" })

  await db.insert(auditLog).values({
    actorId: admin.id,
    action: `report:${status}`,
    targetType: "report",
    targetId: id,
  })
  return updated
})
