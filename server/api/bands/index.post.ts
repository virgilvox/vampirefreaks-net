import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { bands } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"
import { slugify } from "../../utils/cult"

// Propose a band page. The creator owns it, but it stays unapproved and off the
// public list until staff approve it, so nobody can impersonate a real act.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `band:${userId}`, 8, 60_000)

  const body = await readBody<{
    name?: unknown
    genre?: unknown
    location?: unknown
    bio?: unknown
  }>(event)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name) throw createError({ statusCode: 400, statusMessage: "A name is required" })
  if (name.length > 100) throw createError({ statusCode: 400, statusMessage: "Name is too long" })

  const str = (v: unknown, max: number): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null

  const base = slugify(name).slice(0, 40) || "band"
  const slug = await uniqueSlug(base)

  const [created] = await db
    .insert(bands)
    .values({
      ownerUserId: userId,
      slug,
      name,
      genre: str(body?.genre, 60),
      location: str(body?.location, 120),
      bio: typeof body?.bio === "string" ? body.bio.slice(0, 4000) : "",
      approved: false,
    })
    .returning()
  if (!created) throw createError({ statusCode: 500, statusMessage: "Could not create band" })
  setResponseStatus(event, 201)
  return { slug: created.slug, approved: created.approved }
})

async function uniqueSlug(base: string): Promise<string> {
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i}`
    const [taken] = await db.select({ id: bands.id }).from(bands).where(eq(bands.slug, candidate))
    if (!taken) return candidate
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`
}
