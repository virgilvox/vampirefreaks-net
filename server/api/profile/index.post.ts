import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { profiles } from "../../db/schema"
import { requireUser } from "../../utils/session"
import { normalizeUsername } from "../../utils/username"

// Onboarding. Turns a bare auth account into a member by claiming a unique
// username and the few fields the public profile needs. One profile per user:
// a second call is rejected so the handle cannot be silently rebound.
const BUCKETS = new Set(["boys", "girls", "everyone", "none"])

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody<{
    username?: unknown
    displayName?: unknown
    tagline?: unknown
    leaderboardBucket?: unknown
    genderLabel?: unknown
    birthdate?: unknown
  }>(event)

  const check = normalizeUsername(body?.username)
  if (!check.ok) throw createError({ statusCode: 400, statusMessage: check.reason })

  const existing = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
  if (existing.length > 0) {
    throw createError({ statusCode: 409, statusMessage: "Profile already exists" })
  }

  const bucket =
    typeof body?.leaderboardBucket === "string" && BUCKETS.has(body.leaderboardBucket)
      ? body.leaderboardBucket
      : "none"

  // A birthdate drives the single adult-or-not gate. Stored only as the derived
  // flag plus the date; no precise public age.
  let birthdate: Date | null = null
  let isAdult = false
  if (typeof body?.birthdate === "string" && body.birthdate) {
    const parsed = new Date(body.birthdate)
    if (!Number.isNaN(parsed.getTime())) {
      birthdate = parsed
      isAdult = yearsSince(parsed) >= 18
    }
  }

  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() || null : null
  const tagline = typeof body?.tagline === "string" ? body.tagline.trim() || null : null
  const genderLabel = typeof body?.genderLabel === "string" ? body.genderLabel.trim() || null : null

  try {
    const [created] = await db
      .insert(profiles)
      .values({
        userId: user.id,
        username: check.value,
        displayName,
        tagline,
        genderLabel,
        leaderboardBucket: bucket,
        birthdate,
        isAdult,
      })
      .returning()
    setResponseStatus(event, 201)
    return created
  } catch (error) {
    // The unique index on username is the source of truth for collisions.
    if (isUniqueViolation(error)) {
      throw createError({ statusCode: 409, statusMessage: "That username is taken" })
    }
    throw error
  }
})

function yearsSince(date: Date): number {
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const m = now.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1
  return age
}

function isUniqueViolation(error: unknown): boolean {
  // drizzle wraps the driver error, so the Postgres SQLSTATE (23505 =
  // unique_violation) can sit on the error itself or on its cause.
  const code = (e: unknown): string | undefined =>
    typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined
  if (code(error) === "23505") return true
  const cause =
    typeof error === "object" && error !== null ? (error as { cause?: unknown }).cause : undefined
  return code(cause) === "23505"
}
