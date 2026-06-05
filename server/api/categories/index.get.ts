import { asc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { categories } from "../../db/schema"
import { requireUser } from "../../utils/session"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(asc(categories.name))
})
