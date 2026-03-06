/**
 * Build a { header: {...}, footer: {...} } map from a layouts array.
 */
export function buildLayoutMap(
  layouts: Array<{ type: string; html: string; css: string }>
): Record<string, { html: string; css: string }> {
  const map: Record<string, { html: string; css: string }> = {}
  for (const layout of layouts) {
    map[layout.type] = { html: layout.html, css: layout.css }
  }
  return map
}
