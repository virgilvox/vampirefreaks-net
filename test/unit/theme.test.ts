import { describe, expect, it } from "vitest"
import { THEMES } from "../../app/composables/useTheme"

// The three shipped aesthetics. Adding one is a new theme file plus a name
// here; this test is the reminder that the two stay in sync.
describe("themes", () => {
  it("ships the three documented aesthetics", () => {
    expect([...THEMES]).toEqual(["punk-zine", "industrial", "paper-teal"])
  })
})
