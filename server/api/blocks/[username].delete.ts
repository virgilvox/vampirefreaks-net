import { and, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { blocks } from "../../db/schema"
import { requireProfile, getProfileByUsername } from "../../utils/profile"

// Unblock a member. Only removes the block this member created; a block the
// other person set stays in place.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const target = await getProfileByUsername(getRouterParam(event, "username") ?? "")
  if (!target) throw createError({ statusCode: 404, statusMessage: "No such member" })

  await db
    .delete(blocks)
    .where(and(eq(blocks.blockerId, userId), eq(blocks.blockedId, target.userId)))
  return { blocked: false }
})
