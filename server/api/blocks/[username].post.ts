import { and, eq, or } from "drizzle-orm"
import { db } from "../../db/client"
import { blocks, friendships } from "../../db/schema"
import { requireProfile, getProfileByUsername } from "../../utils/profile"

// Block a member. Cuts messaging, rating, commenting, and friend requests in
// both directions (the write paths consult isBlocked), and clears any existing
// friendship so a block also unfriends. Idempotent.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const target = await getProfileByUsername(getRouterParam(event, "username") ?? "")
  if (!target) throw createError({ statusCode: 404, statusMessage: "No such member" })
  if (target.userId === userId) {
    throw createError({ statusCode: 400, statusMessage: "You cannot block yourself" })
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(blocks)
      .values({ blockerId: userId, blockedId: target.userId })
      .onConflictDoNothing({ target: [blocks.blockerId, blocks.blockedId] })
    await tx
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, target.userId)),
          and(eq(friendships.requesterId, target.userId), eq(friendships.addresseeId, userId)),
        ),
      )
  })

  setResponseStatus(event, 201)
  return { blocked: true }
})
