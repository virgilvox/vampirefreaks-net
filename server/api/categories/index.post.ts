import { db } from "../../db/client"
import { categories } from "../../db/schema"
import { requireUser } from "../../utils/session"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ name?: unknown }>(event)

  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "name is required" })
  }

  const [created] = await db.insert(categories).values({ userId: user.id, name }).returning()
  setResponseStatus(event, 201)
  return created
})
