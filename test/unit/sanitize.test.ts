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

  it("strips at-rule blocks so unscoped selectors cannot escape", () => {
    const out = sanitizeCss("@media all { body { display:none } } .x { color: red }")
    expect(out.toLowerCase()).not.toContain("@media")
    expect(out.toLowerCase()).not.toContain("body")
    expect(out).toContain("color: red")
  })

  it("strips @supports and @layer blocks too", () => {
    const out = sanitizeCss(
      "@supports (display:grid) { html { background:url(http://evil) } } a{color:#fff}",
    )
    expect(out.toLowerCase()).not.toContain("@supports")
    expect(out.toLowerCase()).not.toContain("html")
    expect(out).toContain("color:#fff")
  })

  it("strips viewport-fixed positioning that would escape the container", () => {
    const fixed = sanitizeCss(".x { position: fixed; inset: 0; }")
    expect(fixed.toLowerCase()).not.toContain("position: fixed")
    const sticky = sanitizeCss(".y { position:sticky; top:0 }")
    expect(sticky.toLowerCase()).not.toContain("position:sticky")
  })

  it("excludes svg data URIs from the url allowlist", () => {
    const out = sanitizeCss("div { background: url(data:image/svg+xml,<svg onload=alert(1)>); }")
    expect(out).toContain("about:blank")
    expect(out.toLowerCase()).not.toContain("svg")
  })
})
