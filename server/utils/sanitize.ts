// Defense in depth for the bounded custom CSS members and cults can set. The
// real isolation for freeform layouts is the separate-origin sandbox in PRD
// section 10; this strips the constructs that turn CSS into a script or data
// exfiltration vector before the value is ever stored, so even the structured
// path never lands hostile CSS in the app origin.
//
// Strips: @import, behavior, expression(), javascript: urls, and any url()
// pointing off the media CDN. Caps length so a profile cannot ship a stylesheet
// the size of a page.

const MAX_CSS_LENGTH = 8000

const CDN_BASE = (process.env.SPACES_CDN_BASE ?? "").replace(/\/$/, "")

// A url() is allowed only when it targets the project's own media CDN, a data:
// image, or a relative path. Everything else (tracking pixels, off-domain
// fetches) is stripped to about:blank.
function safeUrl(raw: string): string {
  const value = raw.trim().replace(/^['"]|['"]$/g, "")
  if (value.startsWith("data:image/")) return value
  if (value.startsWith("/")) return value
  if (CDN_BASE && value.startsWith(CDN_BASE)) return value
  return "about:blank"
}

export function sanitizeCss(input: unknown): string {
  if (typeof input !== "string") return ""
  let css = input.slice(0, MAX_CSS_LENGTH)

  // Drop CSS comments so a comment cannot hide a banned token from the filters.
  css = css.replace(/\/\*[\s\S]*?\*\//g, "")
  // Kill the classic IE script vectors and remote stylesheet pulls outright.
  css = css.replace(/@import[^;]+;?/gi, "")
  css = css.replace(/expression\s*\([^)]*\)/gi, "")
  css = css.replace(/behavior\s*:[^;}]*/gi, "")
  css = css.replace(/-moz-binding[^;}]*/gi, "")
  css = css.replace(/javascript\s*:/gi, "")
  // Rewrite every url() through the allowlist.
  css = css.replace(/url\(\s*([^)]*?)\s*\)/gi, (_m, inner: string) => `url(${safeUrl(inner)})`)

  return css.trim()
}
