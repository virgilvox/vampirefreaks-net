import { and, eq, or } from "drizzle-orm"
import { db } from "../../db/client"
import { friendships, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// The member's friend graph in one read: accepted friends, requests waiting on
// them, and requests they have sent. Each entry carries the other member's
// public handle so the UI links straight to the profile.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)

  const rows = await db
    .select({
      id: friendships.id,
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
      status: friendships.status,
      otherUsername: profiles.username,
      otherDisplayName: profiles.displayName,
      otherAvatarPhotoId: profiles.avatarPhotoId,
    })
    .from(friendships)
    .innerJoin(
      profiles,
      or(
        and(eq(friendships.requesterId, userId), eq(profiles.userId, friendships.addresseeId)),
        and(eq(friendships.addresseeId, userId), eq(profiles.userId, friendships.requesterId)),
      ),
    )
    .where(or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)))

  const friends = rows.filter((r) => r.status === "accepted")
  const incoming = rows.filter((r) => r.status === "pending" && r.addresseeId === userId)
  const outgoing = rows.filter((r) => r.status === "pending" && r.requesterId === userId)
  return { friends, incoming, outgoing }
})
