import type { H3Event } from "h3"
import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { profiles, type Profile } from "../db/schema"
import { requireUser } from "./session"

// Resolves the signed-in member's profile or throws. A fresh account has a
// user row but no profile until it claims a username at onboarding, so this is
// the gate that stops an un-onboarded account from posting or rating.
export async function requireProfile(
  event: H3Event,
): Promise<{ userId: string; profile: Profile }> {
  const user = await requireUser(event)
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id))
  if (!profile) {
    throw createError({ statusCode: 403, statusMessage: "Claim a username first" })
  }
  return { userId: user.id, profile }
}

// Public lookup by handle. Returns null rather than throwing so a page can
// render its own 404.
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username.toLowerCase()))
  return profile ?? null
}

// The average a member shows publicly, or null when they have no ratings or
// have opted out of the leaderboards (which hides the number too).
export function publicAverage(
  profile: Pick<Profile, "ratingCount" | "ratingSum" | "leaderboardBucket">,
): number | null {
  if (profile.leaderboardBucket === "none") return null
  if (profile.ratingCount === 0) return null
  return Math.round((profile.ratingSum / profile.ratingCount) * 10) / 10
}
