import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { auditLog, bands } from "../../db/schema"
import { requireUser } from "../../utils/session"
import { enforceRateLimit } from "../../utils/rate-limit"

// Edit a band (owner) or approve it (staff). Approval is recorded in the audit
// log. The owner can update the details; only staff can flip approved.
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
    throw createError({ statusCode: 403, statusMessage: "Not yours to edit" })

  const body = await readBody<{
    genre?: unknown
    location?: unknown
    bio?: unknown
    approved?: unknown
  }>(event)
  const patch: Record<string, unknown> = {}
  if (isOwner) {
    if (typeof body.genre === "string" || body.genre === null) {
      patch.genre = typeof body.genre === "string" ? body.genre.trim().slice(0, 60) || null : null
    }
    if (typeof body.location === "string" || body.location === null) {
      patch.location =
        typeof body.location === "string" ? body.location.trim().slice(0, 120) || null : null
    }
    if (typeof body.bio === "string") patch.bio = body.bio.slice(0, 4000)
  }
  if (isStaff && typeof body.approved === "boolean") patch.approved = body.approved

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" })
  }

  const [updated] = await db.update(bands).set(patch).where(eq(bands.id, band.id)).returning()
  if (typeof patch.approved === "boolean") {
    await db.insert(auditLog).values({
      actorId: user.id,
      action: `band:approved=${patch.approved}`,
      targetType: "band",
      targetId: band.id,
    })
  }
  return updated
})
