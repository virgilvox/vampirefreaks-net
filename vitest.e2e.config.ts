import { defineConfig } from "vitest/config"

// End-to-end tests. These boot the real Nitro server and talk to a real
// Postgres, no mocks, per the project's testing rules. They are gated on
// DATABASE_URL so `npm run test` stays infrastructure-free; run them with a
// database up: `docker compose up -d db && npm run test:e2e`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/e2e/**/*.e2e.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 240_000,
  },
})
