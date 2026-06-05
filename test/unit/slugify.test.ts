import { describe, expect, it } from "vitest"
import { slugify } from "../../app/utils/slugify"

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Acme Inc")).toBe("acme-inc")
  })

  it("collapses runs of non-alphanumeric characters to one dash", () => {
    expect(slugify("Hello   World!!!  Again")).toBe("hello-world-again")
  })

  it("strips leading and trailing separators", () => {
    expect(slugify("  --Spaced--  ")).toBe("spaced")
    expect(slugify("!!!edges!!!")).toBe("edges")
  })

  it("keeps digits", () => {
    expect(slugify("Route 66 Diner")).toBe("route-66-diner")
  })

  it("returns an empty string when there is nothing slug-worthy", () => {
    expect(slugify("   ")).toBe("")
    expect(slugify("!!!")).toBe("")
  })

  it("drops non-ascii letters rather than transliterating", () => {
    expect(slugify("Café Niño")).toBe("caf-ni-o")
  })
})
