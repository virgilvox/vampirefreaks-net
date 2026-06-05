import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { photos, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Delete a photo. Owner only. If it was the member's avatar, clear the pointer.
// The object in Spaces is left in place for now; a storage sweep can reap
// orphaned objects later.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""

  const [deleted] = await db
    .delete(photos)
    .where(and(eq(photos.id, id), eq(photos.userId, userId)))
    .returning({ id: photos.id })
  if (!deleted) throw createError({ statusCode: 404, statusMessage: "No such photo" })

  await db
    .update(profiles)
    .set({ avatarPhotoId: null })
    .where(and(eq(profiles.userId, userId), eq(profiles.avatarPhotoId, id)))

  return { ok: true }
})
