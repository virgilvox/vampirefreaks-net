import { and, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { messages } from "../../../db/schema"
import { requireProfile } from "../../../utils/profile"

// Mark a received message read. Only the recipient can, so the read state
// reflects the inbox owner.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const id = getRouterParam(event, "id") ?? ""
  const [updated] = await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.id, id), eq(messages.recipientId, userId)))
    .returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: "No such message" })
  return updated
})
