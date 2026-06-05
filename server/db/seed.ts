import "./load-env"
import { desc, eq } from "drizzle-orm"
import { db } from "./client"
import { categories, notes, user } from "./schema"

// Sample data for the example notes page. Attaches to a real user so it shows
// up when you log in: set SEED_USER_EMAIL, or it picks the most recently created
// user (the account you just signed up with). With no users yet, it creates a
// demo placeholder. Idempotent: skips a user who already has notes.
const DEMO_USER_ID = "usr_demo"

async function resolveTargetUserId(): Promise<string> {
  const email = process.env.SEED_USER_EMAIL
  if (email) {
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.email, email))
    if (!found) {
      throw new Error(`No user with email ${email}. Sign up first, then re-run the seed.`)
    }
    return found.id
  }

  const [recent] = await db
    .select({ id: user.id })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(1)
  if (recent) return recent.id

  await db
    .insert(user)
    .values({ id: DEMO_USER_ID, name: "Demo", email: "demo@jig.local", emailVerified: true })
    .onConflictDoNothing()
  return DEMO_USER_ID
}

async function seed(): Promise<void> {
  const userId = await resolveTargetUserId()

  const existing = await db
    .select({ id: notes.id })
    .from(notes)
    .where(eq(notes.userId, userId))
    .limit(1)
  if (existing.length > 0) {
    console.log(`User ${userId} already has notes; nothing to seed.`)
    return
  }

  const [work, ideas] = await db
    .insert(categories)
    .values([
      { userId, name: "Work" },
      { userId, name: "Ideas" },
    ])
    .returning()

  await db.insert(notes).values([
    {
      userId,
      categoryId: work?.id ?? null,
      title: "Rename the clone",
      body: "Swap jig for the real product name.",
    },
    {
      userId,
      categoryId: work?.id ?? null,
      title: "Wire OAuth keys",
      body: "Drop GitHub client id and secret into .env.",
    },
    {
      userId,
      categoryId: ideas?.id ?? null,
      title: "Try a new theme",
      body: "Add one file under assets/design/themes.",
      done: true,
    },
  ])

  console.log(`Seeded categories and notes for user ${userId}.`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
