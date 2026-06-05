import { alias } from "drizzle-orm/pg-core"
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "../db/client"
import { photos, profiles } from "../db/schema"

// The era's leaderboards. A 5-rating floor keeps a single 10 from topping the
// board; rows order by average descending. newest ignores ratings and orders by
// join date. Opted-out members (bucket none) never appear.
const MIN_RATINGS = 5
const PAGE = 25

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const bucket = typeof q.bucket === "string" ? q.bucket : "popular"
  // NULLIF guards the newest tab, where members can have zero ratings: dividing
  // by it yields null rather than a division-by-zero error.
  const avg = sql<number>`(${profiles.ratingSum}::float / NULLIF(${profiles.ratingCount}, 0))`
  const avatar = alias(photos, "lb_avatar")

  const base = {
    username: profiles.username,
    displayName: profiles.displayName,
    avatarUrl: avatar.url,
    leaderboardBucket: profiles.leaderboardBucket,
    ratingCount: profiles.ratingCount,
    average: sql<number>`round(${avg}::numeric, 1)`,
    createdAt: profiles.createdAt,
  }

  if (bucket === "newest") {
    return db
      .select(base)
      .from(profiles)
      .leftJoin(avatar, eq(avatar.id, profiles.avatarPhotoId))
      .orderBy(desc(profiles.createdAt))
      .limit(PAGE)
  }

  const buckets =
    bucket === "boys" ? ["boys"] : bucket === "girls" ? ["girls"] : ["boys", "girls", "everyone"]

  return db
    .select(base)
    .from(profiles)
    .leftJoin(avatar, eq(avatar.id, profiles.avatarPhotoId))
    .where(
      and(inArray(profiles.leaderboardBucket, buckets), gte(profiles.ratingCount, MIN_RATINGS)),
    )
    .orderBy(desc(avg))
    .limit(PAGE)
})
