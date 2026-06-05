import { existsSync } from "node:fs"

// Loads .env for scripts run outside Nitro (the seed, mainly). Import this
// before anything that reads process.env so DATABASE_URL is set in time.
// process.loadEnvFile is available on Node 20.12+ and 22+.
if (existsSync(".env")) {
  process.loadEnvFile(".env")
}
