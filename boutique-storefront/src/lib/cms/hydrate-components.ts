import { parse } from "node-html-parser"

export type HtmlSegment = { type: "html"; content: string }
export type ComponentSegment = {
  type: "component"
  name: string
  attrs: Record<string, string>
  innerHTML: string
  outerHTML: string
}
export type Segment = HtmlSegment | ComponentSegment

/**
 * Parses CMS HTML and extracts data-component markers.
 * Returns an ordered array of static HTML segments and component segments.
 */
export function extractComponents(html: string): Segment[] {
  if (!html) return []

  const root = parse(html, { comment: true })
  const componentNodes = root.querySelectorAll("[data-component]")

  if (componentNodes.length === 0) {
    return [{ type: "html", content: html }]
  }

  const components: Array<{
    marker: string
    name: string
    attrs: Record<string, string>
    innerHTML: string
    outerHTML: string
  }> = []

  componentNodes.forEach((node, i) => {
    const marker = `__CMS_COMPONENT_${i}__`
    const name = node.getAttribute("data-component")!
    const attrs: Record<string, string> = {}

    for (const [key, value] of Object.entries(node.attributes)) {
      if (key.startsWith("data-")) {
        attrs[key] = value
      }
    }

    // Capture outerHTML before replacing — used as fallback for static rendering
    const outerHTML = node.toString()
    components.push({ marker, name, attrs, innerHTML: node.innerHTML, outerHTML })
    node.replaceWith(marker)
  })

  const markedHtml = root.toString()
  const segments: Segment[] = []
  let remaining = markedHtml

  for (const comp of components) {
    const idx = remaining.indexOf(comp.marker)
    if (idx === -1) {
      // Marker not found — render as static HTML fallback
      segments.push({ type: "html", content: comp.innerHTML })
      continue
    }
    if (idx > 0) {
      const htmlChunk = remaining.slice(0, idx).trim()
      if (htmlChunk) {
        segments.push({ type: "html", content: htmlChunk })
      }
    }
    segments.push({
      type: "component",
      name: comp.name,
      attrs: comp.attrs,
      innerHTML: comp.innerHTML,
      outerHTML: comp.outerHTML,
    })
    remaining = remaining.slice(idx + comp.marker.length)
  }

  const tail = remaining.trim()
  if (tail) {
    segments.push({ type: "html", content: tail })
  }

  return segments
}

/**
 * Checks if the HTML contains a specific data-component.
 */
export function hasComponent(html: string, componentName: string): boolean {
  return html.includes(`data-component="${componentName}"`)
}
