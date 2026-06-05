import { and, eq, or } from "drizzle-orm"
import { db } from "../../db/client"
import { blocks, friendships } from "../../db/schema"
import { requireProfile, getProfileByUsername } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"

// Send a friend request. If the other member already has a request out to you,
// this accepts it instead of stacking a second row, so a mutual add lands as a
// friendship in one step. A block in either direction stops the request.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `friend:${userId}`, 60, 60_000)

  const username = getRouterParam(event, "username") ?? ""
  const target = await getProfileByUsername(username)
  if (!target) throw createError({ statusCode: 404, statusMessage: "No such member" })
  if (target.userId === userId) {
    throw createError({ statusCode: 400, statusMessage: "You cannot friend yourself" })
  }

  const [blocked] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, userId), eq(blocks.blockedId, target.userId)),
        and(eq(blocks.blockerId, target.userId), eq(blocks.blockedId, userId)),
      ),
    )
  if (blocked) throw createError({ statusCode: 403, statusMessage: "Unavailable" })

  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, target.userId)),
        and(eq(friendships.requesterId, target.userId), eq(friendships.addresseeId, userId)),
      ),
    )

  if (existing) {
    if (existing.status === "accepted") return { status: "friends" }
    if (existing.addresseeId === userId) {
      await db
        .update(friendships)
        .set({ status: "accepted" })
        .where(eq(friendships.id, existing.id))
      return { status: "friends" }
    }
    return { status: "pending_out" }
  }

  await db
    .insert(friendships)
    .values({ requesterId: userId, addresseeId: target.userId, status: "pending" })
  setResponseStatus(event, 201)
  return { status: "pending_out" }
})
