import { existsSync } from "node:fs"
import { defineConfig } from "drizzle-kit"

// drizzle-kit does not read .env on its own, so load it here. This keeps
// db:generate, db:migrate, db:push, and db:studio pointed at the same database
// the app uses, instead of only the fallback below.
if (existsSync(".env")) {
  process.loadEnvFile(".env")
}

const databaseUrl = process.env.DATABASE_URL ?? "postgres://jig:jig@localhost:5432/jig"

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
})
