import { and, eq, sql } from "drizzle-orm"
import { db } from "../../../db/client"
import { cultMembers, cults } from "../../../db/schema"
import { requireProfile } from "../../../utils/profile"
import { getCultBySlug, membership } from "../../../utils/cult"

// Leave a cult. The owner cannot leave their own cult (they would orphan it);
// they delete it or transfer ownership instead, which is a later action. An
// active member leaving decrements the count in the same transaction.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const slug = getRouterParam(event, "slug") ?? ""
  const cult = await getCultBySlug(slug)
  if (!cult) throw createError({ statusCode: 404, statusMessage: "No such cult" })

  const m = await membership(cult.id, userId)
  if (!m) return { status: "none" }
  if (m.role === "owner") {
    throw createError({ statusCode: 400, statusMessage: "The owner cannot leave their own cult" })
  }

  const wasActive = m.status === "active"
  await db.transaction(async (tx) => {
    await tx
      .delete(cultMembers)
      .where(and(eq(cultMembers.cultId, cult.id), eq(cultMembers.userId, userId)))
    if (wasActive) {
      await tx
        .update(cults)
        .set({ memberCount: sql`GREATEST(${cults.memberCount} - 1, 0)` })
        .where(eq(cults.id, cult.id))
    }
  })

  return { status: "none" }
})
