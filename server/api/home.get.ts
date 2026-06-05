import { alias } from "drizzle-orm/pg-core"
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "../db/client"
import { photos, profiles } from "../db/schema"

// The oversaturated homepage in one call: the leaderboard buckets and the
// newest members, server-rendered so the logged-out view is fast and
// indexable.
const MIN_RATINGS = 5

const avg = sql<number>`(${profiles.ratingSum}::float / NULLIF(${profiles.ratingCount}, 0))`
const avatar = alias(photos, "home_avatar")
const cols = {
  username: profiles.username,
  displayName: profiles.displayName,
  avatarUrl: avatar.url,
  average: sql<number>`round(${avg}::numeric, 1)`,
  ratingCount: profiles.ratingCount,
}

function rated(buckets: string[]) {
  return db
    .select(cols)
    .from(profiles)
    .leftJoin(avatar, eq(avatar.id, profiles.avatarPhotoId))
    .where(
      and(inArray(profiles.leaderboardBucket, buckets), gte(profiles.ratingCount, MIN_RATINGS)),
    )
    .orderBy(desc(avg))
    .limit(8)
}

export default defineEventHandler(async () => {
  const [popular, boys, girls, newest] = await Promise.all([
    rated(["boys", "girls", "everyone"]),
    rated(["boys"]),
    rated(["girls"]),
    db
      .select({
        username: profiles.username,
        displayName: profiles.displayName,
        avatarUrl: avatar.url,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .leftJoin(avatar, eq(avatar.id, profiles.avatarPhotoId))
      .orderBy(desc(profiles.createdAt))
      .limit(8),
  ])

  return { popular, boys, girls, newest }
})
