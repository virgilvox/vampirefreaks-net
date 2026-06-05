import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { bands, songs } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Attach or detach a track to a band, or rename it. Owner of the track only,
// and the band must be one the member owns, so a track cannot be pinned onto
// someone else's band.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""

  const [song] = await db
    .select({ id: songs.id })
    .from(songs)
    .where(and(eq(songs.id, id), eq(songs.uploaderId, userId)))
  if (!song) throw createError({ statusCode: 404, statusMessage: "No such track" })

  const body = await readBody<{ title?: unknown; bandId?: unknown }>(event)
  const patch: { title?: string; bandId?: string | null } = {}

  if (typeof body.title === "string") {
    const t = body.title.trim()
    if (!t) throw createError({ statusCode: 400, statusMessage: "A title is required" })
    patch.title = t.slice(0, 200)
  }
  if (body.bandId === null) patch.bandId = null
  else if (typeof body.bandId === "string") {
    const [band] = await db
      .select({ id: bands.id })
      .from(bands)
      .where(and(eq(bands.id, body.bandId), eq(bands.ownerUserId, userId)))
    if (!band) throw createError({ statusCode: 403, statusMessage: "Not your band" })
    patch.bandId = body.bandId
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" })
  }
  const [updated] = await db.update(songs).set(patch).where(eq(songs.id, id)).returning()
  return updated
})
