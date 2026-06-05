import { describe, expect, it } from "vitest"
import { THEMES } from "../../app/composables/useTheme"

// The shipped aesthetics. Adding one is a new theme file plus a name here;
// this test keeps the two in sync. crypt is the default for vampirefreaks.net.
describe("themes", () => {
  it("ships the documented aesthetics including crypt", () => {
    expect([...THEMES]).toEqual(["punk-zine", "industrial", "paper-teal", "crypt"])
  })
})
