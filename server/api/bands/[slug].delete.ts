import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { auditLog, bands } from "../../db/schema"
import { requireUser } from "../../utils/session"
import { enforceRateLimit } from "../../utils/rate-limit"

// Delete a band. The owner or staff only. Attached songs detach automatically
// (songs.bandId is onDelete set null), so a member's own tracks survive. A staff
// deletion is recorded in the audit log; an owner removing their own is not.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  enforceRateLimit(event, `band-edit:${user.id}`, 20, 60_000)
  const slug = getRouterParam(event, "slug")?.toLowerCase() ?? ""
  const [band] = await db
    .select({ id: bands.id, ownerUserId: bands.ownerUserId })
    .from(bands)
    .where(eq(bands.slug, slug))
  if (!band) throw createError({ statusCode: 404, statusMessage: "No such band" })

  const isOwner = user.id === band.ownerUserId
  const isStaff = (user as { role?: string }).role === "admin"
  if (!isOwner && !isStaff)
    throw createError({ statusCode: 403, statusMessage: "Not yours to delete" })

  await db.delete(bands).where(eq(bands.id, band.id))
  if (isStaff && !isOwner) {
    await db.insert(auditLog).values({
      actorId: user.id,
      action: "band:deleted",
      targetType: "band",
      targetId: band.id,
    })
  }
  return { ok: true }
})
