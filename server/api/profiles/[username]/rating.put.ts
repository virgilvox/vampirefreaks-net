import { and, eq, sql } from "drizzle-orm"
import { db } from "../../../db/client"
import { profileRatings, profiles } from "../../../db/schema"
import { requireProfile } from "../../../utils/profile"
import { enforceRateLimit } from "../../../utils/rate-limit"

// Rate a member's profile 1 to 10. One score per rater per target, re-rating
// overwrites. The write and the target's aggregate move together in one
// transaction so the leaderboard never drifts from the underlying rows.
export default defineEventHandler(async (event) => {
  const { userId: raterId } = await requireProfile(event)
  enforceRateLimit(event, `rate:${raterId}`, 60, 60_000)

  const targetUsername = getRouterParam(event, "username")?.toLowerCase() ?? ""
  const body = await readBody<{ score?: unknown }>(event)
  const score = Number(body?.score)
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    throw createError({ statusCode: 400, statusMessage: "Score must be an integer from 1 to 10" })
  }

  const [target] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.username, targetUsername))
  if (!target) throw createError({ statusCode: 404, statusMessage: "No such member" })
  if (target.userId === raterId) {
    throw createError({ statusCode: 400, statusMessage: "You cannot rate your own profile" })
  }

  const result = await db.transaction(async (tx) => {
    const [prev] = await tx
      .select({ score: profileRatings.score })
      .from(profileRatings)
      .where(
        and(eq(profileRatings.raterId, raterId), eq(profileRatings.targetUserId, target.userId)),
      )

    if (prev) {
      const delta = score - prev.score
      await tx
        .update(profileRatings)
        .set({ score })
        .where(
          and(eq(profileRatings.raterId, raterId), eq(profileRatings.targetUserId, target.userId)),
        )
      await tx
        .update(profiles)
        .set({ ratingSum: sql`${profiles.ratingSum} + ${delta}` })
        .where(eq(profiles.userId, target.userId))
    } else {
      await tx.insert(profileRatings).values({ raterId, targetUserId: target.userId, score })
      await tx
        .update(profiles)
        .set({
          ratingSum: sql`${profiles.ratingSum} + ${score}`,
          ratingCount: sql`${profiles.ratingCount} + 1`,
        })
        .where(eq(profiles.userId, target.userId))
    }

    const [agg] = await tx
      .select({ ratingSum: profiles.ratingSum, ratingCount: profiles.ratingCount })
      .from(profiles)
      .where(eq(profiles.userId, target.userId))
    return agg
  })

  const average =
    result && result.ratingCount > 0
      ? Math.round((result.ratingSum / result.ratingCount) * 10) / 10
      : null
  return { yourScore: score, average, ratingCount: result?.ratingCount ?? 0 }
})
