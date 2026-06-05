// Accept only http(s) links, so a stored URL cannot become a javascript: or
// data: vector when rendered as an anchor (event links, and anywhere else a
// member-supplied URL is echoed back). Pure, so it is unit-testable on its own.
export function safeHttpUrl(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null
  try {
    const u = new URL(v.trim())
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString().slice(0, 500) : null
  } catch {
    return null
  }
}
