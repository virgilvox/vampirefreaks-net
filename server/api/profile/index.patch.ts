import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { profiles, songs } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { sanitizeCss, safeMediaUrl } from "../../utils/sanitize"

// Owner edit of the profile fields and the structured customization. The handle
// and the rating aggregates are not editable here: the handle is claimed once,
// the aggregates are owned by the rating handler. customCss is sanitized before
// it is stored.
const BUCKETS = new Set(["boys", "girls", "everyone", "none"])
const FONTS = new Set(["display", "body", "mono", "serif", "system"])

function str(v: unknown, max = 2000): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v !== "string") return undefined
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const body = await readBody<Record<string, unknown>>(event)

  const patch: Record<string, unknown> = {}

  const displayName = str(body.displayName, 60)
  if (displayName !== undefined) patch.displayName = displayName
  const tagline = str(body.tagline, 140)
  if (tagline !== undefined) patch.tagline = tagline
  if (typeof body.bio === "string") patch.bio = body.bio.slice(0, 10000)
  const location = str(body.location, 80)
  if (location !== undefined) patch.location = location
  const genderLabel = str(body.genderLabel, 40)
  if (genderLabel !== undefined) patch.genderLabel = genderLabel

  if (typeof body.leaderboardBucket === "string" && BUCKETS.has(body.leaderboardBucket)) {
    patch.leaderboardBucket = body.leaderboardBucket
  }
  if (typeof body.indexable === "boolean") patch.indexable = body.indexable

  // Structured customization.
  for (const key of ["bgColor", "accentColor", "textColor", "linkColor"] as const) {
    const v = body[key]
    if (v === null) patch[key] = null
    else if (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v.trim())) patch[key] = v.trim()
  }
  // The background image renders as url() in an inline style, so hold it to the
  // same CDN/relative/data-image allowlist as the freeform CSS path. An
  // off-origin value is rejected rather than stored, so a profile cannot beacon
  // to an arbitrary host on view.
  const bgImageUrl = str(body.bgImageUrl, 500)
  if (bgImageUrl === null) patch.bgImageUrl = null
  else if (bgImageUrl !== undefined) {
    const safe = safeMediaUrl(bgImageUrl)
    if (!safe)
      throw createError({ statusCode: 400, statusMessage: "That background URL is not allowed" })
    patch.bgImageUrl = safe
  }
  if (typeof body.fontChoice === "string" && FONTS.has(body.fontChoice))
    patch.fontChoice = body.fontChoice
  if (body.fontChoice === null) patch.fontChoice = null

  if (body.customCss !== undefined) {
    patch.customCss = body.customCss === null ? null : sanitizeCss(body.customCss)
  }

  // avatarPhotoId and bannerPhotoId are set by the gallery handlers that can
  // prove ownership. profileSongId is accepted here only after confirming the
  // track belongs to this member, so it cannot point at someone else's song.
  if (body.profileSongId === null) {
    patch.profileSongId = null
  } else if (typeof body.profileSongId === "string") {
    const [owned] = await db
      .select({ id: songs.id })
      .from(songs)
      .where(and(eq(songs.id, body.profileSongId), eq(songs.uploaderId, userId)))
    if (!owned) throw createError({ statusCode: 400, statusMessage: "That is not your track" })
    patch.profileSongId = body.profileSongId
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" })
  }

  const [updated] = await db
    .update(profiles)
    .set(patch)
    .where(eq(profiles.userId, userId))
    .returning()
  return updated
})
