import { and, eq } from "drizzle-orm"
import { db } from "../db/client"
import { categories } from "../db/schema"

// Rejects a categoryId the user does not own, so a note can never reference
// another user's category. Used by the note create and update handlers.
export async function assertOwnedCategory(categoryId: string, userId: string): Promise<void> {
  const owned = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
  if (owned.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Unknown category" })
  }
}
