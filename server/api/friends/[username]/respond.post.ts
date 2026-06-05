import { and, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { friendships } from "../../../db/schema"
import { requireProfile, getProfileByUsername } from "../../../utils/profile"

// Accept or decline a request that is waiting on the signed-in member. Declining
// deletes the pending row so nothing lingers and a fresh request can be sent
// later.
export default defineEventHandler(async (event) => {
  const { userId } = await requireProfile(event)
  const username = getRouterParam(event, "username") ?? ""
  const body = await readBody<{ action?: unknown }>(event)
  const action = body?.action
  if (action !== "accept" && action !== "decline") {
    throw createError({ statusCode: 400, statusMessage: "action must be accept or decline" })
  }

  const other = await getProfileByUsername(username)
  if (!other) throw createError({ statusCode: 404, statusMessage: "No such member" })

  const [pending] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.requesterId, other.userId),
        eq(friendships.addresseeId, userId),
        eq(friendships.status, "pending"),
      ),
    )
  if (!pending) throw createError({ statusCode: 404, statusMessage: "No pending request" })

  if (action === "accept") {
    await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, pending.id))
    return { status: "friends" }
  }
  await db.delete(friendships).where(eq(friendships.id, pending.id))
  return { status: "none" }
})
