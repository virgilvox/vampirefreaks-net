import { asc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { bands, profiles, songs } from "../../db/schema"
import { optionalUser } from "../../utils/session"

// A band page with its tracks. An unapproved band is visible only to its owner
// and to staff (with a pending note), so a proposal is not public before review.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")?.toLowerCase() ?? ""
  const [band] = await db
    .select({
      id: bands.id,
      slug: bands.slug,
      name: bands.name,
      genre: bands.genre,
      location: bands.location,
      bio: bands.bio,
      approved: bands.approved,
      ownerUserId: bands.ownerUserId,
      ownerUsername: profiles.username,
    })
    .from(bands)
    .leftJoin(profiles, eq(profiles.userId, bands.ownerUserId))
    .where(eq(bands.slug, slug))
  if (!band) throw createError({ statusCode: 404, statusMessage: "No such band" })

  const viewer = await optionalUser(event)
  const isOwner = Boolean(viewer && viewer.id === band.ownerUserId)
  const isStaff = (viewer as { role?: string } | null)?.role === "admin"
  if (!band.approved && !isOwner && !isStaff) {
    throw createError({ statusCode: 404, statusMessage: "No such band" })
  }

  const tracks = await db
    .select({ id: songs.id, title: songs.title, url: songs.url })
    .from(songs)
    .where(eq(songs.bandId, band.id))
    .orderBy(asc(songs.createdAt))
    .limit(100)

  return { ...band, tracks, isOwner, canApprove: isStaff }
})
