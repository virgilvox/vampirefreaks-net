import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { reports } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"
import { resolveReportTarget } from "../../utils/report"

// File a report against a piece of content. The target is validated and a
// readable label and link are snapshotted so the queue stays useful after the
// content is gone. Rate limited to curb report spam.
const TYPES = new Set(["profile", "journal", "post", "cult"])

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `report:${userId}`, 20, 60_000)

  const body = await readBody<{ targetType?: unknown; targetId?: unknown; reason?: unknown }>(event)
  const targetType = typeof body?.targetType === "string" ? body.targetType : ""
  const targetId = typeof body?.targetId === "string" ? body.targetId : ""
  const reason = typeof body?.reason === "string" ? body.reason.trim() : ""
  if (!TYPES.has(targetType))
    throw createError({ statusCode: 400, statusMessage: "Unknown target" })
  if (!reason) throw createError({ statusCode: 400, statusMessage: "Say what is wrong" })
  if (reason.length > 2000)
    throw createError({ statusCode: 400, statusMessage: "Reason is too long" })

  const resolved = await resolveReportTarget(targetType, targetId)
  if (!resolved) throw createError({ statusCode: 404, statusMessage: "No such content" })

  // One open report per reporter per target: re-reporting the same thing is a
  // no-op rather than another row flooding the queue.
  const [dup] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, userId),
        eq(reports.targetType, targetType),
        eq(reports.targetId, targetId),
        eq(reports.status, "open"),
      ),
    )
  if (dup) {
    setResponseStatus(event, 201)
    return { ok: true }
  }

  await db.insert(reports).values({
    reporterId: userId,
    targetType,
    targetId,
    targetLabel: resolved.label,
    targetHref: resolved.href,
    reason,
  })
  setResponseStatus(event, 201)
  return { ok: true }
})
