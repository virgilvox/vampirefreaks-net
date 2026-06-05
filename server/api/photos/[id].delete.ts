import { and, desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { cults, events, photos, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Delete a photo. Owner only. If it was the primary (the avatar), promote the
// newest remaining photo to primary and point the avatar at it, all in one
// transaction, so a member never ends up with photos but a blank avatar. Any
// other pointer at this photo (banner, event flyer, cult icon) is cleared too,
// so nothing is left dangling. The object in Spaces is left for a later sweep.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""

  await db.transaction(async (tx) => {
    const [photo] = await tx
      .select({ id: photos.id, isPrimary: photos.isPrimary })
      .from(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, userId)))
    if (!photo) throw createError({ statusCode: 404, statusMessage: "No such photo" })

    await tx.delete(photos).where(eq(photos.id, id))

    if (photo.isPrimary) {
      const [next] = await tx
        .select({ id: photos.id })
        .from(photos)
        .where(eq(photos.userId, userId))
        .orderBy(desc(photos.createdAt))
        .limit(1)
      if (next) {
        await tx.update(photos).set({ isPrimary: true }).where(eq(photos.id, next.id))
        await tx.update(profiles).set({ avatarPhotoId: next.id }).where(eq(profiles.userId, userId))
      } else {
        await tx.update(profiles).set({ avatarPhotoId: null }).where(eq(profiles.userId, userId))
      }
    } else {
      // Clear the avatar pointer if it somehow referenced this photo.
      await tx
        .update(profiles)
        .set({ avatarPhotoId: null })
        .where(and(eq(profiles.userId, userId), eq(profiles.avatarPhotoId, id)))
    }

    // Clear the other pointers this photo could be standing in for. The photo is
    // the member's own, so anywhere it is referenced was set by this same member.
    await tx
      .update(profiles)
      .set({ bannerPhotoId: null })
      .where(and(eq(profiles.userId, userId), eq(profiles.bannerPhotoId, id)))
    await tx.update(events).set({ flyerPhotoId: null }).where(eq(events.flyerPhotoId, id))
    await tx.update(cults).set({ iconPhotoId: null }).where(eq(cults.iconPhotoId, id))
  })

  return { ok: true }
})
