import { and, eq, sql } from "drizzle-orm"
import { db } from "../../../../db/client"
import { cultMembers, cults } from "../../../../db/schema"
import { requireProfile, getProfileByUsername } from "../../../../utils/profile"
import { assertCultManager, getCultBySlug, membership } from "../../../../utils/cult"

// Manage a cult member, addressed by handle. approve turns a pending request
// active (and bumps the count); remove drops a member; promote/demote toggle the
// moderator role and are owner-only. The owner row cannot be removed or demoted.
export default defineEventHandler(async (event) => {
  const { userId: actorId } = await requireProfile(event)
  const slug = getRouterParam(event, "slug") ?? ""
  const targetProfile = await getProfileByUsername(getRouterParam(event, "username") ?? "")
  if (!targetProfile) throw createError({ statusCode: 404, statusMessage: "No such member" })
  const targetId = targetProfile.userId
  const body = await readBody<{ action?: unknown }>(event)
  const action = body?.action
  if (action !== "approve" && action !== "remove" && action !== "promote" && action !== "demote") {
    throw createError({ statusCode: 400, statusMessage: "Unknown action" })
  }

  const cult = await getCultBySlug(slug)
  if (!cult) throw createError({ statusCode: 404, statusMessage: "No such cult" })
  const actorRole = await assertCultManager(event, cult.id, actorId)

  const target = await membership(cult.id, targetId)
  if (!target) throw createError({ statusCode: 404, statusMessage: "Not a member" })
  if (target.role === "owner") {
    throw createError({ statusCode: 400, statusMessage: "Cannot manage the owner" })
  }

  if (action === "promote" || action === "demote") {
    if (actorRole !== "owner") throw createError({ statusCode: 403, statusMessage: "Owner only" })
    await db
      .update(cultMembers)
      .set({ role: action === "promote" ? "moderator" : "member" })
      .where(and(eq(cultMembers.cultId, cult.id), eq(cultMembers.userId, targetId)))
    return { ok: true }
  }

  if (action === "approve") {
    if (target.status === "active") return { ok: true }
    await db.transaction(async (tx) => {
      await tx
        .update(cultMembers)
        .set({ status: "active" })
        .where(and(eq(cultMembers.cultId, cult.id), eq(cultMembers.userId, targetId)))
      await tx
        .update(cults)
        .set({ memberCount: sql`${cults.memberCount} + 1` })
        .where(eq(cults.id, cult.id))
    })
    return { ok: true }
  }

  // remove. A moderator can remove members but only the owner can remove another
  // moderator, so mods cannot demote each other by removal.
  if (target.role === "moderator" && actorRole !== "owner") {
    throw createError({ statusCode: 403, statusMessage: "Only the owner can remove a moderator" })
  }
  await db.transaction(async (tx) => {
    await tx
      .delete(cultMembers)
      .where(and(eq(cultMembers.cultId, cult.id), eq(cultMembers.userId, targetId)))
    if (target.status === "active") {
      await tx
        .update(cults)
        .set({ memberCount: sql`GREATEST(${cults.memberCount} - 1, 0)` })
        .where(eq(cults.id, cult.id))
    }
  })
  return { ok: true }
})
