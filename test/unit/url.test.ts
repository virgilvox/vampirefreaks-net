import { describe, expect, it } from "vitest"
import { safeHttpUrl } from "../../server/utils/url"

describe("safeHttpUrl", () => {
  it("accepts http and https links", () => {
    expect(safeHttpUrl("http://example.test/show")).toBe("http://example.test/show")
    expect(safeHttpUrl("https://example.test/show")).toBe("https://example.test/show")
  })

  it("rejects javascript: and data: vectors", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBe(null)
    expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(null)
  })

  it("rejects non-strings, blanks, and garbage", () => {
    expect(safeHttpUrl(undefined)).toBe(null)
    expect(safeHttpUrl(null)).toBe(null)
    expect(safeHttpUrl(42)).toBe(null)
    expect(safeHttpUrl("   ")).toBe(null)
    expect(safeHttpUrl("not a url")).toBe(null)
  })

  it("caps the stored length at 500 characters", () => {
    const long = `https://example.test/${"a".repeat(800)}`
    const out = safeHttpUrl(long)
    expect(out).not.toBe(null)
    expect((out as string).length).toBe(500)
  })
})
