import { and, desc, gte, inArray, sql } from "drizzle-orm"
import { db } from "../db/client"
import { profiles } from "../db/schema"

// The era's leaderboards. A 5-rating floor keeps a single 10 from topping the
// board; rows order by average descending. newest ignores ratings and orders by
// join date. Opted-out members (bucket none) never appear.
const MIN_RATINGS = 5
const PAGE = 25

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const bucket = typeof q.bucket === "string" ? q.bucket : "popular"
  const avg = sql<number>`(${profiles.ratingSum}::float / ${profiles.ratingCount})`

  const base = {
    username: profiles.username,
    displayName: profiles.displayName,
    avatarPhotoId: profiles.avatarPhotoId,
    leaderboardBucket: profiles.leaderboardBucket,
    ratingCount: profiles.ratingCount,
    average: sql<number>`round(${avg}::numeric, 1)`,
    createdAt: profiles.createdAt,
  }

  if (bucket === "newest") {
    return db.select(base).from(profiles).orderBy(desc(profiles.createdAt)).limit(PAGE)
  }

  const buckets =
    bucket === "boys" ? ["boys"] : bucket === "girls" ? ["girls"] : ["boys", "girls", "everyone"]

  return db
    .select(base)
    .from(profiles)
    .where(
      and(inArray(profiles.leaderboardBucket, buckets), gte(profiles.ratingCount, MIN_RATINGS)),
    )
    .orderBy(desc(avg))
    .limit(PAGE)
})
