import { desc, eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { photos } from "../../../db/schema"
import { getProfileByUsername } from "../../../utils/profile"

// A member's public gallery, primary first then newest.
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, "username") ?? ""
  const target = await getProfileByUsername(username)
  if (!target) throw createError({ statusCode: 404, statusMessage: "No such member" })

  return db
    .select({
      id: photos.id,
      url: photos.url,
      caption: photos.caption,
      isPrimary: photos.isPrimary,
      createdAt: photos.createdAt,
    })
    .from(photos)
    .where(eq(photos.userId, target.userId))
    .orderBy(desc(photos.isPrimary), desc(photos.createdAt))
    .limit(200)
})
