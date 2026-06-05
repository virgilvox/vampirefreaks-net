import { desc, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { journals } from "../../../db/schema"
import { getProfileByUsername } from "../../../utils/profile"
import { optionalUser } from "../../../utils/session"
import { areFriends } from "../../../utils/friends"

// A member's journal entries, filtered to what the viewer may see: public to
// all, friends-only to accepted friends and the owner, private to the owner.
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, "username") ?? ""
  const target = await getProfileByUsername(username)
  if (!target) throw createError({ statusCode: 404, statusMessage: "No such member" })

  const viewer = await optionalUser(event)
  const isOwner = viewer?.id === target.userId
  const friend = !isOwner && viewer ? await areFriends(target.userId, viewer.id) : false

  const rows = await db
    .select({
      id: journals.id,
      title: journals.title,
      body: journals.body,
      mood: journals.mood,
      visibility: journals.visibility,
      commentCount: journals.commentCount,
      createdAt: journals.createdAt,
    })
    .from(journals)
    .where(eq(journals.userId, target.userId))
    .orderBy(desc(journals.createdAt))
    .limit(50)

  return rows.filter((j) => {
    if (j.visibility === "public") return true
    if (isOwner) return true
    if (j.visibility === "friends") return friend
    return false
  })
})
