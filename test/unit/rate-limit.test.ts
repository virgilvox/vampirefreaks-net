import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { enforceRateLimit } from "../../server/utils/rate-limit"

// The limiter reaches for two h3 server auto-imports on the throttled path.
// Stub them so the pure counting logic can be tested without a server.
const g = globalThis as Record<string, unknown>
const fakeEvent = {} as Parameters<typeof enforceRateLimit>[0]

describe("enforceRateLimit", () => {
  let savedDisable: string | undefined

  beforeEach(() => {
    savedDisable = process.env.DISABLE_RATE_LIMIT
    delete process.env.DISABLE_RATE_LIMIT
    g.setResponseHeader = vi.fn()
    g.createError = (o: { statusCode?: number; statusMessage?: string }) =>
      Object.assign(new Error(o.statusMessage ?? "error"), o)
  })

  afterEach(() => {
    if (savedDisable === undefined) delete process.env.DISABLE_RATE_LIMIT
    else process.env.DISABLE_RATE_LIMIT = savedDisable
    vi.useRealTimers()
  })

  it("allows up to the limit, then throws past it and sets retry-after", () => {
    const key = "unit-limit"
    for (let i = 0; i < 3; i += 1) {
      expect(() => enforceRateLimit(fakeEvent, key, 3, 60_000)).not.toThrow()
    }
    expect(() => enforceRateLimit(fakeEvent, key, 3, 60_000)).toThrow()
    expect(g.setResponseHeader).toHaveBeenCalledWith(fakeEvent, "retry-after", expect.any(Number))
  })

  it("resets the allowance after the window elapses", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2030, 0, 1))
    const key = "unit-reset"
    enforceRateLimit(fakeEvent, key, 2, 1000)
    enforceRateLimit(fakeEvent, key, 2, 1000)
    expect(() => enforceRateLimit(fakeEvent, key, 2, 1000)).toThrow()
    vi.advanceTimersByTime(1001)
    expect(() => enforceRateLimit(fakeEvent, key, 2, 1000)).not.toThrow()
  })

  it("is a no-op when DISABLE_RATE_LIMIT is set", () => {
    process.env.DISABLE_RATE_LIMIT = "true"
    const key = "unit-disabled"
    for (let i = 0; i < 25; i += 1) {
      expect(() => enforceRateLimit(fakeEvent, key, 1, 60_000)).not.toThrow()
    }
  })
})
