import { describe, expect, it } from "vitest"
import { sanitizeCss } from "../../server/utils/sanitize"

describe("sanitizeCss", () => {
  it("strips @import so remote stylesheets cannot load", () => {
    const out = sanitizeCss("@import url('http://evil.test/x.css'); body { color: red; }")
    expect(out).not.toContain("@import")
    expect(out).toContain("color: red")
  })

  it("strips the IE expression() and behavior script vectors", () => {
    const out = sanitizeCss("a { width: expression(alert(1)); behavior: url(x.htc); }")
    expect(out.toLowerCase()).not.toContain("expression(")
    expect(out.toLowerCase()).not.toContain("behavior")
  })

  it("strips javascript: urls", () => {
    const out = sanitizeCss("a { background: url(javascript:alert(1)); }")
    expect(out.toLowerCase()).not.toContain("javascript:")
  })

  it("rewrites off-domain url() to about:blank", () => {
    const out = sanitizeCss("div { background: url(https://tracker.test/p.gif); }")
    expect(out).toContain("about:blank")
    expect(out).not.toContain("tracker.test")
  })

  it("keeps data: image urls", () => {
    const out = sanitizeCss("div { background: url(data:image/png;base64,AAAA); }")
    expect(out).toContain("data:image/png")
  })

  it("cannot hide a banned token inside a comment", () => {
    const out = sanitizeCss("/* @import 'x'; */ body { color: red; }")
    expect(out).not.toContain("@import")
  })

  it("returns an empty string for non-string input", () => {
    expect(sanitizeCss(null)).toBe("")
    expect(sanitizeCss(undefined)).toBe("")
  })
})
