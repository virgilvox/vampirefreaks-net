import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { auditLog, threads } from "../../db/schema"
import { requireAdmin } from "../../utils/session"

// Pin or lock a thread. Staff only for site boards. Each action is recorded in
// the audit log for accountability.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, "id") ?? ""
  const body = await readBody<{ pinned?: unknown; locked?: unknown }>(event)

  const patch: Record<string, boolean> = {}
  if (typeof body?.pinned === "boolean") patch.pinned = body.pinned
  if (typeof body?.locked === "boolean") patch.locked = body.locked
  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to change" })
  }

  const [updated] = await db.update(threads).set(patch).where(eq(threads.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: "No such thread" })

  await db.insert(auditLog).values({
    actorId: admin.id,
    action: `thread:${Object.entries(patch)
      .map(([k, v]) => `${k}=${v}`)
      .join(",")}`,
    targetType: "thread",
    targetId: id,
  })
  return updated
})
