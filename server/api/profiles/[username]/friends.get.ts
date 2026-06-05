import { alias } from "drizzle-orm/pg-core"
import { and, eq, or } from "drizzle-orm"
import { db } from "../../../db/client"
import { friendships, photos, profiles } from "../../../db/schema"
import { getProfileByUsername } from "../../../utils/profile"

// Public list of a member's accepted friends, each with their handle. Reads the
// one stored friendship row in either direction.
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, "username") ?? ""
  const target = await getProfileByUsername(username)
  if (!target) throw createError({ statusCode: 404, statusMessage: "No such member" })

  const friendProfile = alias(profiles, "friend_profile")
  const friendAvatar = alias(photos, "friend_avatar")
  const rows = await db
    .select({
      username: friendProfile.username,
      displayName: friendProfile.displayName,
      avatarUrl: friendAvatar.url,
    })
    .from(friendships)
    .innerJoin(
      friendProfile,
      or(
        and(
          eq(friendships.requesterId, target.userId),
          eq(friendProfile.userId, friendships.addresseeId),
        ),
        and(
          eq(friendships.addresseeId, target.userId),
          eq(friendProfile.userId, friendships.requesterId),
        ),
      ),
    )
    .leftJoin(friendAvatar, eq(friendAvatar.id, friendProfile.avatarPhotoId))
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, target.userId), eq(friendships.addresseeId, target.userId)),
      ),
    )

  return rows
})
