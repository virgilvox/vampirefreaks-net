import { and, eq, or } from "drizzle-orm"
import { db } from "../db/client"
import { friendships } from "../db/schema"

// True when the two members have an accepted friendship, in either direction.
// Journal visibility and the friend feed gate on this.
export async function areFriends(a: string, b: string): Promise<boolean> {
  if (a === b) return true
  const [row] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(
          and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
          and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
        ),
      ),
    )
  return Boolean(row)
}

// Whether a viewer (possibly signed out) may read content at this visibility,
// owned by ownerId. Shared by journals now and other visibility-gated content
// later.
export async function canView(
  visibility: string,
  ownerId: string,
  viewerId: string | null,
): Promise<boolean> {
  if (visibility === "public") return true
  if (!viewerId) return false
  if (viewerId === ownerId) return true
  if (visibility === "friends") return areFriends(ownerId, viewerId)
  return false // private
}
