import { alias } from "drizzle-orm/pg-core"
import { and, eq, or } from "drizzle-orm"
import { db } from "../../db/client"
import { messages, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// A single message, readable only by its sender or recipient, joined to both
// handles so the thread can render names and reply. Opening one the member
// received marks it read.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""

  const senderProfile = alias(profiles, "sender_profile")
  const recipientProfile = alias(profiles, "recipient_profile")

  const [msg] = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      subject: messages.subject,
      body: messages.body,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
      senderUsername: senderProfile.username,
      recipientUsername: recipientProfile.username,
    })
    .from(messages)
    .leftJoin(senderProfile, eq(senderProfile.userId, messages.senderId))
    .leftJoin(recipientProfile, eq(recipientProfile.userId, messages.recipientId))
    .where(
      and(eq(messages.id, id), or(eq(messages.senderId, userId), eq(messages.recipientId, userId))),
    )
  if (!msg) throw createError({ statusCode: 404, statusMessage: "No such message" })

  if (msg.recipientId === userId && !msg.readAt) {
    await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, id))
    msg.readAt = new Date()
  }
  return msg
})
