import "./load-env"
import { eq, sql } from "drizzle-orm"
import { db } from "./client"
import { boards, journals, profiles, profileRatings, statusUpdates, user } from "./schema"

// Seeds a starter scene so a fresh database is not an empty room: a handful of
// members with ratings, plus the site forum boards. Idempotent on the members
// (keyed by email) and the boards (keyed by slug). Run with `npm run db:seed`.

type Seed = {
  email: string
  name: string
  username: string
  displayName: string
  tagline: string
  bucket: string
  bio: string
}

const MEMBERS: Seed[] = [
  {
    email: "raven@vf.local",
    name: "Raven",
    username: "raven",
    displayName: "Raven",
    tagline: "nocturnal by design",
    bucket: "girls",
    bio: "EBM, rivetheads, and bad weather.",
  },
  {
    email: "ash@vf.local",
    name: "Ash",
    username: "ashes",
    displayName: "Ash",
    tagline: "industrial since the cassette era",
    bucket: "boys",
    bio: "If it has a drum machine and a grudge, I am there.",
  },
  {
    email: "lily@vf.local",
    name: "Lily",
    username: "lilymorgue",
    displayName: "Lily Morgue",
    tagline: "velvet and rust",
    bucket: "girls",
    bio: "Deathrock DJ. Ask me about my hair.",
  },
  {
    email: "vex@vf.local",
    name: "Vex",
    username: "vex",
    displayName: "Vex",
    tagline: "cyber-goth, mostly",
    bucket: "everyone",
    bio: "Glowsticks are a personality.",
  },
  {
    email: "corvid@vf.local",
    name: "Cor",
    username: "corvid",
    displayName: "Corvid",
    tagline: "midnight cartographer",
    bucket: "boys",
    bio: "Maps of places that do not exist.",
  },
]

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

async function ensureMember(s: Seed): Promise<string> {
  const id = `seed_${s.username}`
  await db
    .insert(user)
    .values({ id, name: s.name, email: s.email, emailVerified: true })
    .onConflictDoNothing({ target: user.email })
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, s.email))
  const realId = u?.id ?? id
  await db
    .insert(profiles)
    .values({
      userId: realId,
      username: s.username,
      displayName: s.displayName,
      tagline: s.tagline,
      bio: s.bio,
      leaderboardBucket: s.bucket,
      isAdult: true,
    })
    .onConflictDoNothing({ target: profiles.userId })
  return realId
}

async function seed(): Promise<void> {
  const ids: string[] = []
  for (const m of MEMBERS) ids.push(await ensureMember(m))

  // Every member rates every other member once, so the leaderboards have
  // something to rank. Re-running tops up aggregates idempotently per pair.
  for (const rater of ids) {
    for (const target of ids) {
      if (rater === target) continue
      const score = 6 + Math.floor((rater.length + target.length) % 5) // deterministic 6..10
      const inserted = await db
        .insert(profileRatings)
        .values({ raterId: rater, targetUserId: target, score })
        .onConflictDoNothing({ target: [profileRatings.raterId, profileRatings.targetUserId] })
        .returning({ id: profileRatings.id })
      if (inserted.length > 0) {
        await db
          .update(profiles)
          .set({
            ratingSum: sql`${profiles.ratingSum} + ${score}`,
            ratingCount: sql`${profiles.ratingCount} + 1`,
          })
          .where(eq(profiles.userId, target))
      }
    }
  }

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

  // A few journals and statuses so the homepage feed and the Top Journals rail
  // are not empty. ids match MEMBERS order: raven, ash, lily, vex, corvid.
  const author = (i: number): string => ids[i] ?? ids[0] ?? ""
  const existingJournals = await db.select({ id: journals.id }).from(journals).limit(1)
  if (existingJournals.length === 0 && ids.length > 0) {
    await db.insert(journals).values([
      {
        userId: author(0),
        title: "Three nights without the rain",
        body: "The club reopened and it still smells like clove and fog machine. Felt like coming home.",
        mood: "nostalgic",
        visibility: "public",
      },
      {
        userId: author(1),
        title: "Building a profile in 2026",
        body: "Custom CSS but sandboxed this time. Spent an hour on the cursor. Worth it.",
        mood: "wired",
        visibility: "public",
      },
      {
        userId: author(2),
        title: "Deathrock starter pack",
        body: "If you only know one Christian Death record we need to talk. Comment your gateway song.",
        mood: "evangelical",
        visibility: "public",
      },
    ])
  }

  const existingStatus = await db.select({ id: statusUpdates.id }).from(statusUpdates).limit(1)
  if (existingStatus.length === 0 && ids.length > 0) {
    await db.insert(statusUpdates).values([
      { userId: author(0), body: "rating profiles all night, send yours" },
      { userId: author(1), body: "new mix up, all rivethead everything" },
      { userId: author(2), body: "who is going to the thing on saturday" },
    ])
  }

  console.log(`Seeded ${ids.length} members, ${BOARDS.length} boards, journals, and statuses.`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
