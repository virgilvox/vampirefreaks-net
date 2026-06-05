import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { photos } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"
import { uploadToSpaces } from "../../utils/spaces"

// Upload a gallery photo. The bytes are validated (type and size), stored in
// Spaces under the member's prefix, and recorded. First upload becomes the
// primary by default.
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
}
const MAX_BYTES = 6 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `photo:${userId}`, 40, 60_000)

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === "file" && p.filename)
  if (!file || !file.data) throw createError({ statusCode: 400, statusMessage: "No file" })

  const contentType = file.type ?? ""
  const ext = EXT[contentType]
  if (!ext) throw createError({ statusCode: 400, statusMessage: "Use a PNG, JPEG, GIF, or WebP" })
  if (file.data.length > MAX_BYTES)
    throw createError({ statusCode: 413, statusMessage: "Image is over 6 MB" })

  const captionPart = parts?.find((p) => p.name === "caption")
  const caption = captionPart?.data
    ? captionPart.data.toString("utf8").trim().slice(0, 300) || null
    : null

  const key = `photos/${userId}/${crypto.randomUUID()}.${ext}`
  const url = await uploadToSpaces(key, contentType, file.data)

  // The member's first photo is their primary (and avatar fallback).
  const existing = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.userId, userId))
    .limit(1)
  const isPrimary = existing.length === 0

  const [created] = await db
    .insert(photos)
    .values({ userId, objectKey: key, url, caption, isPrimary })
    .returning()
  setResponseStatus(event, 201)
  return created
})
