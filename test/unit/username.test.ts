import { describe, expect, it } from "vitest"
import { normalizeUsername } from "../../server/utils/username"

describe("normalizeUsername", () => {
  it("lowercases and accepts a valid handle", () => {
    const r = normalizeUsername("RavenX_9")
    expect(r).toEqual({ ok: true, value: "ravenx_9" })
  })

  it("rejects handles that are too short or too long", () => {
    expect(normalizeUsername("ab").ok).toBe(false)
    expect(normalizeUsername("x".repeat(21)).ok).toBe(false)
  })

  it("rejects illegal characters", () => {
    expect(normalizeUsername("bad name").ok).toBe(false)
    expect(normalizeUsername("nope!").ok).toBe(false)
    expect(normalizeUsername("dash-no").ok).toBe(false)
  })

  it("rejects reserved handles that would shadow routes", () => {
    expect(normalizeUsername("admin").ok).toBe(false)
    expect(normalizeUsername("Cults").ok).toBe(false)
    expect(normalizeUsername("messages").ok).toBe(false)
  })

  it("rejects non-string input", () => {
    expect(normalizeUsername(undefined).ok).toBe(false)
    expect(normalizeUsername(42).ok).toBe(false)
  })
})
