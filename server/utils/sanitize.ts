// Defense in depth for the bounded custom CSS members and cults can set. The
// real isolation for freeform layouts is the separate-origin sandbox in PRD
// section 10; this strips the constructs that turn CSS into a script, an
// exfiltration vector, or a page-takeover before the value is ever stored, so
// even the structured path never lands hostile CSS in the app origin.
//
// The companion ProfileBody scopes each rule under the member's container and
// renders inside an isolated, clipped, relatively-positioned box, so the only
// ways to escape the box are at-rules (which carry their own unscoped selectors)
// and viewport-fixed positioning. Both are stripped here. url() is allowlisted
// to the media CDN and raster data URIs; length is capped.

const MAX_CSS_LENGTH = 8000

const CDN_BASE = (process.env.SPACES_CDN_BASE ?? "").replace(/\/$/, "")

// A url() is allowed only when it targets the project's own media CDN, a raster
// data: image, or a relative path. svg data URIs are excluded (they can carry
// markup); everything off-domain is neutralized to about:blank.
function safeUrl(raw: string): string {
  const value = raw.trim().replace(/^['"]|['"]$/g, "")
  if (/^data:image\/(png|jpe?g|gif|webp);/i.test(value)) return value
  if (value.startsWith("/")) return value
  if (CDN_BASE && value.startsWith(CDN_BASE)) return value
  return "about:blank"
}

// Remove every at-rule and its body. An at-rule like @media or @supports wraps
// selectors that the scoping pass cannot reach, so a block such as
// `@media all { body { display:none } }` would inject unscoped global CSS. Drop
// the whole construct, balanced-brace aware, plus at-statements (@import, etc).
function stripAtRules(css: string): string {
  let out = ""
  let i = 0
  while (i < css.length) {
    if (css[i] !== "@") {
      out += css[i]
      i += 1
      continue
    }
    // Find the first { or ; after the at-keyword.
    let j = i + 1
    while (j < css.length && css[j] !== "{" && css[j] !== ";") j += 1
    if (j >= css.length || css[j] === ";") {
      i = j + 1 // an at-statement like @import ...;
      continue
    }
    // Skip the balanced { ... } block.
    let depth = 0
    while (j < css.length) {
      if (css[j] === "{") depth += 1
      else if (css[j] === "}") {
        depth -= 1
        if (depth === 0) {
          j += 1
          break
        }
      }
      j += 1
    }
    i = j
  }
  return out
}

export function sanitizeCss(input: unknown): string {
  if (typeof input !== "string") return ""
  let css = input.slice(0, MAX_CSS_LENGTH)

  // Drop CSS comments first so a comment cannot hide a banned token.
  css = css.replace(/\/\*[\s\S]*?\*\//g, "")
  // Remove all at-rules (and their blocks) so nothing escapes the scope pass.
  css = stripAtRules(css)
  // Kill the classic IE script vectors and remote pulls.
  css = css.replace(/expression\s*\([^)]*\)/gi, "")
  css = css.replace(/behavior\s*:[^;}]*/gi, "")
  css = css.replace(/-moz-binding[^;}]*/gi, "")
  css = css.replace(/javascript\s*:/gi, "")
  // Strip viewport-fixed positioning, which ignores the scope container and
  // enables full-page clickjacking overlays.
  css = css.replace(/position\s*:\s*(fixed|sticky)\s*;?/gi, "")
  // Rewrite every url() through the allowlist.
  css = css.replace(/url\(\s*([^)]*?)\s*\)/gi, (_m, inner: string) => `url(${safeUrl(inner)})`)

  return css.trim()
}
