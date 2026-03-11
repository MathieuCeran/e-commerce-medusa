type LayoutEntry = {
  id: string
  name: string
  html: string
  css: string
  content_position: number
}

type LayoutMapValue = {
  id: string
  html: string
  css: string
  content_position: number
}

/**
 * Build a map keyed by layout name from a layouts array.
 * Includes id in values for lookup by layout_id.
 */
export function buildLayoutMap(
  layouts: LayoutEntry[]
): Record<string, LayoutMapValue> {
  const map: Record<string, LayoutMapValue> = {}
  for (const layout of layouts) {
    map[layout.name] = {
      id: layout.id,
      html: layout.html,
      css: layout.css,
      content_position: layout.content_position,
    }
  }
  return map
}
