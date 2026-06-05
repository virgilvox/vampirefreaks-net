import { desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { messages, profiles } from "../../db/schema"
import { requireProfile } from "../../utils/profile"

// Inbox: messages where the member is the recipient, newest first, each tagged
// with the sender's handle and the read state.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  return db
    .select({
      id: messages.id,
      subject: messages.subject,
      body: messages.body,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      senderUsername: profiles.username,
      senderDisplayName: profiles.displayName,
    })
    .from(messages)
    .leftJoin(profiles, eq(profiles.userId, messages.senderId))
    .where(eq(messages.recipientId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(100)
})
