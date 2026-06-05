import { eq, sql } from "drizzle-orm"
import { db } from "../../../db/client"
import { cultMembers, cults } from "../../../db/schema"
import { requireProfile } from "../../../utils/profile"
import { getCultBySlug, membership } from "../../../utils/cult"
import { enforceRateLimit } from "../../../utils/rate-limit"

// Join a cult according to its policy. open joins immediately (memberCount
// bumped in the same transaction); approval creates a pending request a manager
// accepts; closed rejects. Re-joining when already a member or pending is a
// no-op that returns the current state.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `cultjoin:${userId}`, 30, 60_000)

  const slug = getRouterParam(event, "slug") ?? ""
  const cult = await getCultBySlug(slug)
  if (!cult) throw createError({ statusCode: 404, statusMessage: "No such cult" })

  const existing = await membership(cult.id, userId)
  if (existing) return { status: existing.status }

  if (cult.joinPolicy === "closed") {
    throw createError({ statusCode: 403, statusMessage: "This cult is closed" })
  }

  const status = cult.joinPolicy === "approval" ? "pending" : "active"
  const inserted = await db.transaction(async (tx) => {
    // onConflictDoNothing makes a double-click a clean no-op instead of a unique
    // violation, and the count only bumps when a row actually landed.
    const rows = await tx
      .insert(cultMembers)
      .values({ cultId: cult.id, userId, role: "member", status })
      .onConflictDoNothing({ target: [cultMembers.cultId, cultMembers.userId] })
      .returning({ id: cultMembers.id })
    if (rows.length === 0) return false
    if (status === "active") {
      await tx
        .update(cults)
        .set({ memberCount: sql`${cults.memberCount} + 1` })
        .where(eq(cults.id, cult.id))
    }
    return true
  })

  if (!inserted) {
    const current = await membership(cult.id, userId)
    return { status: current?.status ?? "active" }
  }
  setResponseStatus(event, 201)
  return { status }
})
