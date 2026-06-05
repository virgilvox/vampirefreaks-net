import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { profiles, songs } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Delete a track. Owner only. If it was the member's profile song, clear the
// pointer. The object in Spaces is left for a later sweep.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""

  const [deleted] = await db
    .delete(songs)
    .where(and(eq(songs.id, id), eq(songs.uploaderId, userId)))
    .returning({ id: songs.id })
  if (!deleted) throw createError({ statusCode: 404, statusMessage: "No such track" })

  await db
    .update(profiles)
    .set({ profileSongId: null })
    .where(and(eq(profiles.userId, userId), eq(profiles.profileSongId, id)))

  return { ok: true }
})
