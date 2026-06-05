import { and, eq, or } from "drizzle-orm"
import { db } from "../../db/client"
import { friendships } from "../../db/schema"
import { requireProfile, getProfileByUsername } from "../../utils/profile"

// Remove a friendship or cancel a request the member sent. Symmetric: the one
// stored row is matched in either direction and deleted.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const username = getRouterParam(event, "username") ?? ""
  const other = await getProfileByUsername(username)
  if (!other) throw createError({ statusCode: 404, statusMessage: "No such member" })

  await db
    .delete(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, other.userId)),
        and(eq(friendships.requesterId, other.userId), eq(friendships.addresseeId, userId)),
      ),
    )
  return { status: "none" }
})
