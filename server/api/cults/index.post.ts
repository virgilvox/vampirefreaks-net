import { eq } from "drizzle-orm"
import { db } from "../../db/client"
import { cultMembers, cults } from "../../db/schema"
import { requireProfile } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"
import { slugify } from "../../utils/cult"

// Create a cult. The creator becomes its owner in the same transaction, with
// memberCount seeded at 1. The slug derives from the name and gets a numeric
// suffix if taken, so creation never fails on a slug clash.
const POLICIES = new Set(["open", "approval", "closed"])

export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `cult:${userId}`, 10, 60_000)

  const body = await readBody<{ name?: unknown; description?: unknown; joinPolicy?: unknown }>(
    event,
  )
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name) throw createError({ statusCode: 400, statusMessage: "A name is required" })
  if (name.length > 80) throw createError({ statusCode: 400, statusMessage: "Name is too long" })

  const description =
    typeof body?.description === "string" ? body.description.trim().slice(0, 4000) : ""
  const joinPolicy =
    typeof body?.joinPolicy === "string" && POLICIES.has(body.joinPolicy) ? body.joinPolicy : "open"

  const base = slugify(name).slice(0, 40) || "cult"
  const slug = await uniqueSlug(base)

  const created = await db.transaction(async (tx) => {
    const [cult] = await tx
      .insert(cults)
      .values({ ownerId: userId, slug, name, description, joinPolicy, memberCount: 1 })
      .returning()
    if (!cult) throw createError({ statusCode: 500, statusMessage: "Could not create cult" })
    await tx
      .insert(cultMembers)
      .values({ cultId: cult.id, userId, role: "owner", status: "active" })
    return cult
  })

  setResponseStatus(event, 201)
  return { slug: created.slug }
})

async function uniqueSlug(base: string): Promise<string> {
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i}`
    const [taken] = await db.select({ id: cults.id }).from(cults).where(eq(cults.slug, candidate))
    if (!taken) return candidate
  }
  // Fall back to a random suffix rather than loop forever.
  return `${base}-${crypto.randomUUID().slice(0, 6)}`
}
