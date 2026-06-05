import "./load-env"
import { db } from "./client"
import { boards } from "./schema"

// Sets up the real site structure a fresh database needs: the forum boards.
// It seeds no people and no posts, so the site starts empty and every account
// and entry is a real one. Idempotent on the board slug. Run with
// `npm run db:seed`.

const BOARDS = [
  { name: "General", slug: "general", description: "Talk about anything.", sortOrder: 0 },
  {
    name: "Music",
    slug: "music",
    description: "EBM, industrial, deathrock, the lot.",
    sortOrder: 1,
  },
  { name: "Fashion", slug: "fashion", description: "Show the fit.", sortOrder: 2 },
  { name: "Introductions", slug: "introductions", description: "New here? Step in.", sortOrder: 3 },
]

async function seed(): Promise<void> {
  for (const b of BOARDS) {
    await db
      .insert(boards)
      .values({
        scope: "site",
        name: b.name,
        slug: b.slug,
        description: b.description,
        sortOrder: b.sortOrder,
      })
      .onConflictDoNothing({ target: [boards.scope, boards.slug] })
  }
  console.log(`Seeded ${BOARDS.length} forum boards. No accounts, no posts.`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
