// Turns a display name into a url-safe slug: lowercase, non-alphanumeric runs
// collapsed to single dashes, no leading or trailing dashes. Auto-imported.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
