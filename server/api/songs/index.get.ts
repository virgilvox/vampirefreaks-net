import { desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { bands, songs } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// The signed-in member's own tracks, newest first, each with the band it is
// attached to (if any). Used by the music management page.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  return db
    .select({
      id: songs.id,
      title: songs.title,
      url: songs.url,
      bandId: songs.bandId,
      bandName: bands.name,
      createdAt: songs.createdAt,
    })
    .from(songs)
    .leftJoin(bands, eq(bands.id, songs.bandId))
    .where(eq(songs.uploaderId, userId))
    .orderBy(desc(songs.createdAt))
    .limit(100)
})
