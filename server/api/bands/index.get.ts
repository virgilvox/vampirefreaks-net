import { desc, eq } from "drizzle-orm"
import { db } from "../../db/client"
import { bands } from "../../db/schema"

// Browse approved band pages, newest first. Pending (unapproved) bands stay
// hidden from the public list until staff approve them.
export default defineEventHandler(async () => {
  return db
    .select({
      slug: bands.slug,
      name: bands.name,
      genre: bands.genre,
      location: bands.location,
    })
    .from(bands)
    .where(eq(bands.approved, true))
    .orderBy(desc(bands.createdAt))
    .limit(60)
})
