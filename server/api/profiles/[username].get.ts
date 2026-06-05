import { and, eq, or } from "drizzle-orm"
import { db } from "../../db/client"
import { blocks, friendships, profileRatings, profiles, user as userTable } from "../../db/schema"
import { optionalUser } from "../../utils/session"
import { publicAverage } from "../../utils/profile"

// Public profile read. Returns the member's public fields plus the running
// rating average. When a viewer is signed in, it also returns their own prior
// score and the friendship state, so the header can render the right actions.
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, "username")?.toLowerCase() ?? ""
  const [row] = await db
    .select({
      userId: profiles.userId,
      username: profiles.username,
      displayName: profiles.displayName,
      tagline: profiles.tagline,
      bio: profiles.bio,
      location: profiles.location,
      genderLabel: profiles.genderLabel,
      leaderboardBucket: profiles.leaderboardBucket,
      isAdult: profiles.isAdult,
      bgColor: profiles.bgColor,
      accentColor: profiles.accentColor,
      textColor: profiles.textColor,
      linkColor: profiles.linkColor,
      bgImageUrl: profiles.bgImageUrl,
      fontChoice: profiles.fontChoice,
      customCss: profiles.customCss,
      avatarPhotoId: profiles.avatarPhotoId,
      bannerPhotoId: profiles.bannerPhotoId,
      profileSongId: profiles.profileSongId,
      indexable: profiles.indexable,
      ratingSum: profiles.ratingSum,
      ratingCount: profiles.ratingCount,
      createdAt: profiles.createdAt,
      name: userTable.name,
    })
    .from(profiles)
    .innerJoin(userTable, eq(userTable.id, profiles.userId))
    .where(eq(profiles.username, username))

  if (!row) throw createError({ statusCode: 404, statusMessage: "No such member" })

  const viewer = await optionalUser(event)
  const average = publicAverage(row)
  const showCount = row.leaderboardBucket !== "none" ? row.ratingCount : null

  let viewerRating: number | null = null
  let friendStatus: "none" | "pending_out" | "pending_in" | "friends" | "self" = "none"
  let blocked = false

  if (viewer) {
    if (viewer.id === row.userId) {
      friendStatus = "self"
    } else {
      const [rating] = await db
        .select({ score: profileRatings.score })
        .from(profileRatings)
        .where(
          and(eq(profileRatings.raterId, viewer.id), eq(profileRatings.targetUserId, row.userId)),
        )
      viewerRating = rating?.score ?? null

      const [fr] = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.requesterId, viewer.id), eq(friendships.addresseeId, row.userId)),
            and(eq(friendships.requesterId, row.userId), eq(friendships.addresseeId, viewer.id)),
          ),
        )
      if (fr) {
        if (fr.status === "accepted") friendStatus = "friends"
        else if (fr.requesterId === viewer.id) friendStatus = "pending_out"
        else friendStatus = "pending_in"
      }

      const [b] = await db
        .select({ id: blocks.id })
        .from(blocks)
        .where(
          or(
            and(eq(blocks.blockerId, viewer.id), eq(blocks.blockedId, row.userId)),
            and(eq(blocks.blockerId, row.userId), eq(blocks.blockedId, viewer.id)),
          ),
        )
      blocked = Boolean(b)
    }
  }

  // The raw aggregates never leave the server; the public shape is the rounded
  // average and the count (or null when opted out).
  const publicFields: Omit<typeof row, "ratingSum" | "ratingCount"> & {
    ratingSum?: number
    ratingCount?: number
  } = {
    ...row,
  }
  delete publicFields.ratingSum
  delete publicFields.ratingCount
  return { ...publicFields, average, ratingCount: showCount, viewerRating, friendStatus, blocked }
})
