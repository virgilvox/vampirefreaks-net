import { defineVitestConfig } from "@nuxt/test-utils/config"

// Unit and component tests. Fast, no infrastructure, run with `npm run test`.
// The e2e suite (real server plus Postgres) lives in its own config.
export default defineVitestConfig({
  test: {
    environment: "nuxt",
    include: ["test/unit/**/*.test.ts", "test/components/**/*.test.ts"],
  },
})
