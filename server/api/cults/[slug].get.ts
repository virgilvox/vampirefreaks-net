import { and, asc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { cultMembers, cults, profiles, user as userTable } from "../../db/schema"
import { optionalUser } from "../../utils/session"

// A cult page: its details, the active member roster, the count of pending
// requests (for staff), and the viewer's own membership state so the page can
// show join, leave, or manage.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")?.toLowerCase() ?? ""
  const [cult] = await db
    .select({
      id: cults.id,
      slug: cults.slug,
      name: cults.name,
      description: cults.description,
      joinPolicy: cults.joinPolicy,
      memberCount: cults.memberCount,
      ownerId: cults.ownerId,
      createdAt: cults.createdAt,
    })
    .from(cults)
    .where(eq(cults.slug, slug))
  if (!cult) throw createError({ statusCode: 404, statusMessage: "No such cult" })

  const members = await db
    .select({
      username: profiles.username,
      displayName: profiles.displayName,
      role: cultMembers.role,
      status: cultMembers.status,
    })
    .from(cultMembers)
    .innerJoin(profiles, eq(profiles.userId, cultMembers.userId))
    .where(eq(cultMembers.cultId, cult.id))
    .orderBy(asc(cultMembers.createdAt))
    .limit(500)

  const viewer = await optionalUser(event)
  let viewerMembership: { role: string; status: string } | null = null
  if (viewer) {
    const [row] = await db
      .select({ role: cultMembers.role, status: cultMembers.status })
      .from(cultMembers)
      .where(and(eq(cultMembers.cultId, cult.id), eq(cultMembers.userId, viewer.id)))
    viewerMembership = row ?? null
  }

  // The owner's handle, for display.
  const [owner] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .innerJoin(userTable, eq(userTable.id, profiles.userId))
    .where(eq(profiles.userId, cult.ownerId))

  const active = members.filter((m) => m.status === "active")
  const pending = members.filter((m) => m.status === "pending")
  const isStaff =
    viewerMembership?.status === "active" &&
    (viewerMembership.role === "owner" || viewerMembership.role === "moderator")

  return {
    ...cult,
    ownerUsername: owner?.username ?? null,
    members: active,
    pending: isStaff ? pending : [],
    viewerMembership,
  }
})
