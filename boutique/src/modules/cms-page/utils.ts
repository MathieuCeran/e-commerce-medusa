/**
 * Build a map keyed by layout name from a layouts array.
 */
export function buildLayoutMap(
  layouts: Array<{ name: string; html: string; css: string }>
): Record<string, { html: string; css: string }> {
  const map: Record<string, { html: string; css: string }> = {}
  for (const layout of layouts) {
    map[layout.name] = { html: layout.html, css: layout.css }
  }
  return map
}
