import { desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { messages, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Outgoing view: messages the member sent, each tagged with the recipient's
// handle.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  return db
    .select({
      id: messages.id,
      subject: messages.subject,
      body: messages.body,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
      recipientId: messages.recipientId,
      recipientUsername: profiles.username,
      recipientDisplayName: profiles.displayName,
    })
    .from(messages)
    .leftJoin(profiles, eq(profiles.userId, messages.recipientId))
    .where(eq(messages.senderId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(100)
})
