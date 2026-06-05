import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { songs } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"
import { uploadToSpaces } from "../../utils/spaces"

// Upload an audio track. The bytes are sniffed (not trusted from the client
// content-type) and stored in Spaces under the member's prefix. Tracks can later
// be set as a profile song or attached to a band the member owns.
const MAX_BYTES = 15 * 1024 * 1024
const MAX_SONGS = 100

// Detect common audio containers from the leading bytes.
function detectAudio(buf: Buffer): { ext: string; contentType: string } | null {
  if (buf.length < 12) return null
  const ascii = (start: number, end: number): string => buf.toString("ascii", start, end)
  if (ascii(0, 3) === "ID3" || (buf[0] === 0xff && ((buf[1] ?? 0) & 0xe0) === 0xe0)) {
    return { ext: "mp3", contentType: "audio/mpeg" }
  }
  if (ascii(0, 4) === "OggS") return { ext: "ogg", contentType: "audio/ogg" }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE")
    return { ext: "wav", contentType: "audio/wav" }
  if (ascii(4, 8) === "ftyp") return { ext: "m4a", contentType: "audio/mp4" }
  return null
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `song:${userId}`, 12, 60_000)

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === "file" && p.filename)
  if (!file || !file.data) throw createError({ statusCode: 400, statusMessage: "No file" })
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "Track is over 15 MB" })
  }
  const detected = detectAudio(file.data)
  if (!detected)
    throw createError({ statusCode: 400, statusMessage: "Use an MP3, OGG, WAV, or M4A" })

  const titlePart = parts?.find((p) => p.name === "title")
  const title = titlePart?.data ? titlePart.data.toString("utf8").trim().slice(0, 200) : ""
  if (!title) throw createError({ statusCode: 400, statusMessage: "A title is required" })

  const count = await db.select({ id: songs.id }).from(songs).where(eq(songs.uploaderId, userId))
  if (count.length >= MAX_SONGS)
    throw createError({ statusCode: 409, statusMessage: "Track limit reached" })

  const key = `songs/${userId}/${crypto.randomUUID()}.${detected.ext}`
  const url = await uploadToSpaces(key, detected.contentType, file.data)

  const [created] = await db
    .insert(songs)
    .values({ uploaderId: userId, title, objectKey: key, url })
    .returning()
  setResponseStatus(event, 201)
  return created
})
