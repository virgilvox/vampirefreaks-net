import { and, eq, ne } from "drizzle-orm"
import { db } from "../../db/client"
import { photos, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Edit a photo's caption or make it the primary. Owner only. Making a photo
// primary clears the flag on the member's other photos and sets it as their
// avatar, all in one transaction, so avatar ownership is guaranteed (the photo
// is already the member's own).
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""

  const [photo] = await db
    .select({ id: photos.id })
    .from(photos)
    .where(and(eq(photos.id, id), eq(photos.userId, userId)))
  if (!photo) throw createError({ statusCode: 404, statusMessage: "No such photo" })

  const body = await readBody<{ caption?: unknown; isPrimary?: unknown }>(event)
  const patch: { caption?: string | null } = {}
  if (body.caption === null) patch.caption = null
  else if (typeof body.caption === "string")
    patch.caption = body.caption.trim().slice(0, 300) || null

  const makePrimary = body.isPrimary === true

  await db.transaction(async (tx) => {
    if (Object.keys(patch).length > 0) {
      await tx.update(photos).set(patch).where(eq(photos.id, id))
    }
    if (makePrimary) {
      await tx
        .update(photos)
        .set({ isPrimary: false })
        .where(and(eq(photos.userId, userId), ne(photos.id, id)))
      await tx.update(photos).set({ isPrimary: true }).where(eq(photos.id, id))
      await tx.update(profiles).set({ avatarPhotoId: id }).where(eq(profiles.userId, userId))
    }
  })

  const [updated] = await db.select().from(photos).where(eq(photos.id, id))
  return updated
})
