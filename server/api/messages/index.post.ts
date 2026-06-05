import { and, eq, or } from "drizzle-orm"
import { db } from "../../db/client"
import { blocks, messages } from "../../db/schema"
import { requireProfile, getProfileByUsername } from "../../utils/profile"
import { enforceRateLimit } from "../../utils/rate-limit"

// Send a private message addressed by the recipient's username. A block in
// either direction stops delivery. Sends are rate limited per sender to curb
// spam (PRD section 12).
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  enforceRateLimit(event, `message:${userId}`, 30, 60_000)

  const body = await readBody<{ to?: unknown; subject?: unknown; body?: unknown }>(event)
  const to = typeof body?.to === "string" ? body.to : ""
  const text = typeof body?.body === "string" ? body.body.trim() : ""
  if (!text) throw createError({ statusCode: 400, statusMessage: "Message body is required" })
  if (text.length > 10000)
    throw createError({ statusCode: 400, statusMessage: "Message is too long" })

  const recipient = await getProfileByUsername(to)
  if (!recipient) throw createError({ statusCode: 404, statusMessage: "No such member" })
  if (recipient.userId === userId) {
    throw createError({ statusCode: 400, statusMessage: "You cannot message yourself" })
  }

  const [blocked] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, userId), eq(blocks.blockedId, recipient.userId)),
        and(eq(blocks.blockerId, recipient.userId), eq(blocks.blockedId, userId)),
      ),
    )
  if (blocked) throw createError({ statusCode: 403, statusMessage: "Unavailable" })

  const subject =
    typeof body?.subject === "string" ? body.subject.trim().slice(0, 140) || null : null
  const [created] = await db
    .insert(messages)
    .values({ senderId: userId, recipientId: recipient.userId, subject, body: text })
    .returning()
  setResponseStatus(event, 201)
  return created
})
