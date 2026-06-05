import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { photos, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"
import { uploadToSpaces } from "../../utils/spaces"

// Upload a gallery photo. The bytes are sniffed (not trusted from the client
// content-type), stored in Spaces under the member's prefix, and recorded. The
// member's first photo becomes their primary and their avatar, set in the same
// transaction so the avatar actually points at it.
const MAX_BYTES = 6 * 1024 * 1024
const MAX_PHOTOS = 300

// Detect the real image type from the leading bytes, so a client cannot pass a
// non-image (or a script) under an image content-type. The stored content-type
// and extension come from this, never from the request header.
function detectImage(buf: Buffer): { ext: string; contentType: string } | null {
  if (buf.length < 12) return null
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: "png", contentType: "image/png" }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" }
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return { ext: "gif", contentType: "image/gif" }
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", contentType: "image/webp" }
  }
  return null
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `photo:${userId}`, 12, 60_000)

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === "file" && p.filename)
  if (!file || !file.data) throw createError({ statusCode: 400, statusMessage: "No file" })
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "Image is over 6 MB" })
  }

  const detected = detectImage(file.data)
  if (!detected)
    throw createError({ statusCode: 400, statusMessage: "Use a PNG, JPEG, GIF, or WebP" })

  const count = await db.select({ id: photos.id }).from(photos).where(eq(photos.userId, userId))
  if (count.length >= MAX_PHOTOS) {
    throw createError({ statusCode: 409, statusMessage: "Gallery is full" })
  }

  const captionPart = parts?.find((p) => p.name === "caption")
  const caption = captionPart?.data
    ? captionPart.data.toString("utf8").trim().slice(0, 300) || null
    : null

  // The first photo is always the avatar; a later upload can ask to become the
  // avatar with a primary flag, so the editor sets an avatar in one request.
  const primaryPart = parts?.find((p) => p.name === "primary")
  const wantPrimary = primaryPart?.data?.toString("utf8") === "true"
  const isPrimary = count.length === 0 || wantPrimary

  const key = `photos/${userId}/${crypto.randomUUID()}.${detected.ext}`
  const url = await uploadToSpaces(key, detected.contentType, file.data)

  const created = await db.transaction(async (tx) => {
    if (isPrimary) {
      await tx.update(photos).set({ isPrimary: false }).where(eq(photos.userId, userId))
    }
    const [row] = await tx
      .insert(photos)
      .values({ userId, objectKey: key, url, caption, isPrimary })
      .returning()
    if (isPrimary && row) {
      await tx.update(profiles).set({ avatarPhotoId: row.id }).where(eq(profiles.userId, userId))
    }
    return row
  })

  setResponseStatus(event, 201)
  return created
})
