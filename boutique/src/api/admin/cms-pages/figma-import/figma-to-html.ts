/**
 * Figma-to-HTML Converter v3 — Section-level hybrid
 *
 * Strategy:
 * 1. Root frame's direct children = "sections"
 * 2. Each section is exported as a background image (pixel-perfect)
 * 3. Text nodes within each section are extracted as editable overlays
 * 4. Result: visually faithful sections with editable text
 *
 * This gives the best of both worlds: design fidelity + text editability.
 */

// ── Types ──────────────────────────────────────────────

type FigmaNode = {
  id: string
  name: string
  type: string
  visible?: boolean
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number }
  absoluteRenderBounds?: { x: number; y: number; width: number; height: number }
  children?: FigmaNode[]
  characters?: string
  style?: FigmaTextStyle
  fills?: FigmaFill[]
  opacity?: number
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE"
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
  clipsContent?: boolean
  layoutSizingHorizontal?: string
  layoutSizingVertical?: string
  cornerRadius?: number
  rectangleCornerRadii?: number[]
  effects?: FigmaEffect[]
  strokes?: FigmaStroke[]
  strokeWeight?: number
}

type FigmaTextStyle = {
  fontFamily?: string
  fontWeight?: number
  fontSize?: number
  lineHeightPx?: number
  letterSpacing?: number
  textAlignHorizontal?: string
  italic?: boolean
  textDecoration?: string
}

type FigmaFill = {
  type: string
  visible?: boolean
  color?: FigmaColor
  opacity?: number
  imageRef?: string
  gradientStops?: { position: number; color: FigmaColor }[]
  gradientHandlePositions?: { x: number; y: number }[]
}

type FigmaStroke = { type: string; visible?: boolean; color?: FigmaColor; opacity?: number }
type FigmaEffect = { type: string; visible?: boolean; radius?: number; color?: FigmaColor; offset?: { x: number; y: number }; spread?: number }
type FigmaColor = { r: number; g: number; b: number; a: number }

type TextOverlay = {
  text: string
  x: number
  y: number
  width: number
  fontSize: number
  fontWeight: number
  fontFamily: string
  color: string
  lineHeight: string
  textAlign: string
  letterSpacing: number
}

// ── URL Parser ─────────────────────────────────────────

export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string | null } {
  const parsed = new URL(url)
  const pathParts = parsed.pathname.split("/").filter(Boolean)
  const typeIndex = pathParts.findIndex((p) => p === "design" || p === "file")
  if (typeIndex === -1 || !pathParts[typeIndex + 1]) {
    throw new Error("URL Figma invalide")
  }
  return {
    fileKey: pathParts[typeIndex + 1],
    nodeId: parsed.searchParams.get("node-id"),
  }
}

// ── Figma API ──────────────────────────────────────────

async function apiFetch(url: string, token: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { "X-Figma-Token": token } })

    if (res.status === 429) {
      // Rate limited — wait and retry
      const waitSec = parseInt(res.headers.get("retry-after") || "", 10) || (2 ** attempt) * 2
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, waitSec * 1000))
        continue
      }
      throw new Error("Figma API: trop de requetes. Reessayez dans quelques secondes.")
    }

    if (!res.ok) {
      if (res.status === 403) throw new Error("Figma token invalide ou acces refuse")
      if (res.status === 404) throw new Error("Fichier ou node Figma introuvable")
      throw new Error(`Figma API error ${res.status}`)
    }

    return res.json()
  }
}

async function fetchNode(fileKey: string, nodeId: string | null, token: string): Promise<FigmaNode> {
  if (nodeId) {
    const data = await apiFetch(
      `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`,
      token
    )
    const normalizedId = nodeId.replace("-", ":")
    const node = data.nodes?.[normalizedId]?.document
    if (!node) throw new Error(`Node "${nodeId}" introuvable`)
    return node as FigmaNode
  }
  const data = await apiFetch(`https://api.figma.com/v1/files/${fileKey}`, token)
  return data.document?.children?.[0] as FigmaNode
}

async function fetchImages(
  fileKey: string,
  nodeIds: string[],
  token: string,
  scale = 2
): Promise<Record<string, string>> {
  if (!nodeIds.length) return {}
  const results: Record<string, string> = {}

  // Batch in groups of 50
  for (let i = 0; i < nodeIds.length; i += 50) {
    const batch = nodeIds.slice(i, i + 50).join(",")
    const data = await apiFetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${batch}&format=png&scale=${scale}`,
      token
    )
    Object.assign(results, data.images || {})
  }
  return results
}

// ── Helpers ────────────────────────────────────────────

function rgbaStr(c: FigmaColor, opacity?: number): string {
  const r = Math.round(c.r * 255)
  const g = Math.round(c.g * 255)
  const b = Math.round(c.b * 255)
  const a = (c.a ?? 1) * (opacity ?? 1)
  if (a >= 0.99) return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  return `rgba(${r},${g},${b},${a.toFixed(2)})`
}

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// ── Extract text nodes recursively ─────────────────────

function extractTexts(node: FigmaNode, sectionBounds: { x: number; y: number; width: number; height: number }): TextOverlay[] {
  if (node.visible === false) return []

  if (node.type === "TEXT" && node.characters?.trim()) {
    const bounds = node.absoluteBoundingBox
    if (!bounds) return []

    const s = node.style || {}
    const fill = node.fills?.find((f) => f.type === "SOLID" && f.visible !== false)

    return [{
      text: node.characters.trim(),
      x: bounds.x - sectionBounds.x,
      y: bounds.y - sectionBounds.y,
      width: bounds.width,
      fontSize: s.fontSize || 16,
      fontWeight: s.fontWeight || 400,
      fontFamily: s.fontFamily || "Inter",
      color: fill?.color ? rgbaStr(fill.color, fill.opacity) : "#000",
      lineHeight: s.lineHeightPx && s.fontSize ? (s.lineHeightPx / s.fontSize).toFixed(2) : "1.5",
      textAlign: s.textAlignHorizontal === "CENTER" ? "center" : s.textAlignHorizontal === "RIGHT" ? "right" : "left",
      letterSpacing: s.letterSpacing || 0,
    }]
  }

  if (!node.children) return []
  const texts: TextOverlay[] = []
  for (const child of node.children) {
    texts.push(...extractTexts(child, sectionBounds))
  }
  return texts
}

// ── Detect if section has meaningful auto-layout ───────

function hasAutoLayout(node: FigmaNode): boolean {
  return node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL"
}

function countTexts(node: FigmaNode): number {
  if (node.visible === false) return 0
  if (node.type === "TEXT" && node.characters?.trim()) return 1
  return (node.children || []).reduce((n, c) => n + countTexts(c), 0)
}

// ── Build section as image + text overlays ─────────────

function buildImageSection(
  sectionBounds: { x: number; y: number; width: number; height: number },
  imageUrl: string,
  texts: TextOverlay[],
  rootWidth: number
): string {
  const w = Math.round(sectionBounds.width)
  const h = Math.round(sectionBounds.height)

  // Build text overlay elements
  const textEls = texts.map((t) => {
    const tag = t.fontSize >= 40 ? "h1" : t.fontSize >= 28 ? "h2" : t.fontSize >= 22 ? "h3" : "p"
    const xPct = ((t.x / w) * 100).toFixed(1)
    const yPct = ((t.y / h) * 100).toFixed(1)
    const wPct = ((t.width / w) * 100).toFixed(1)
    const styles = [
      "position:absolute",
      `left:${xPct}%`,
      `top:${yPct}%`,
      `width:${wPct}%`,
      `font-size:${t.fontSize}px`,
      `font-weight:${t.fontWeight}`,
      `font-family:'${t.fontFamily}',sans-serif`,
      `color:transparent`, // invisible by default — user can toggle
      `line-height:${t.lineHeight}`,
      `text-align:${t.textAlign}`,
      t.letterSpacing ? `letter-spacing:${t.letterSpacing.toFixed(1)}px` : "",
      "margin:0",
      "background:none",
      "pointer-events:auto",
      "cursor:text",
    ].filter(Boolean).join(";")

    return `<${tag} style="${styles}" data-figma-text="true">${esc(t.text)}</${tag}>`
  }).join("\n")

  return `<section style="position:relative;width:100%;max-width:${Math.round(rootWidth)}px;margin:0 auto;">
  <img src="${imageUrl}" alt="" style="display:block;width:100%;height:auto;" />
  <div style="position:absolute;inset:0;pointer-events:none;" data-figma-overlay="true">
${textEls}
  </div>
</section>`
}

// ── Build section from auto-layout (editable HTML) ─────

function buildAutoLayoutSection(node: FigmaNode, imageMap: Record<string, string>): string {
  return convertAutoLayoutNode(node, 0, imageMap)
}

function convertAutoLayoutNode(node: FigmaNode, depth: number, imageMap: Record<string, string>): string {
  if (node.visible === false) return ""

  // Text → editable element
  if (node.type === "TEXT" && node.characters?.trim()) {
    const s = node.style || {}
    const fill = node.fills?.find((f) => f.type === "SOLID" && f.visible !== false)
    const css: string[] = []
    if (s.fontSize) css.push(`font-size:${s.fontSize}px`)
    if (s.fontWeight && s.fontWeight !== 400) css.push(`font-weight:${s.fontWeight}`)
    if (s.fontFamily) css.push(`font-family:'${s.fontFamily}',sans-serif`)
    if (s.lineHeightPx && s.fontSize) css.push(`line-height:${(s.lineHeightPx / s.fontSize).toFixed(2)}`)
    if (s.letterSpacing) css.push(`letter-spacing:${s.letterSpacing.toFixed(1)}px`)
    if (s.textAlignHorizontal === "CENTER") css.push("text-align:center")
    if (fill?.color) css.push(`color:${rgbaStr(fill.color, fill.opacity)}`)
    css.push("margin:0")

    const styleAttr = css.length ? ` style="${css.join(";")}"` : ""
    const text = esc(node.characters.trim())
    const fontSize = s.fontSize || 16
    if (fontSize >= 40) return `<h1${styleAttr}>${text}</h1>`
    if (fontSize >= 28) return `<h2${styleAttr}>${text}</h2>`
    if (fontSize >= 22) return `<h3${styleAttr}>${text}</h3>`
    return `<p${styleAttr}>${text}</p>`
  }

  // Image in imageMap → export
  if (imageMap[node.id]) {
    const b = node.absoluteBoundingBox
    return `<img src="${imageMap[node.id]}" alt="${esc(node.name)}" style="display:block;${b?.width ? `width:${Math.round(b.width)}px;` : ""}max-width:100%;height:auto;" />`
  }

  // Non-text leaf or shape → skip
  if (!node.children || node.children.length === 0) {
    // Rectangle with background → div
    const solidFill = node.fills?.find((f) => f.type === "SOLID" && f.visible !== false)
    if (solidFill?.color) {
      const b = node.absoluteBoundingBox
      const css: string[] = []
      if (b?.width) css.push(`width:${Math.round(b.width)}px`, "max-width:100%")
      if (b?.height) css.push(`height:${Math.round(b.height)}px`)
      css.push(`background:${rgbaStr(solidFill.color, solidFill.opacity)}`)
      if (node.cornerRadius) css.push(`border-radius:${node.cornerRadius}px`)
      return `<div style="${css.join(";")}"></div>`
    }
    return ""
  }

  // Frame/container with children
  const css: string[] = []

  if (node.layoutMode === "HORIZONTAL") css.push("display:flex", "flex-direction:row", "flex-wrap:wrap")
  else if (node.layoutMode === "VERTICAL") css.push("display:flex", "flex-direction:column")

  if (node.itemSpacing) css.push(`gap:${node.itemSpacing}px`)

  const pt = node.paddingTop || 0, pr = node.paddingRight || 0, pb = node.paddingBottom || 0, pl = node.paddingLeft || 0
  if (pt || pr || pb || pl) css.push(`padding:${pt}px ${pr}px ${pb}px ${pl}px`)

  const justifyMap: Record<string, string> = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between" }
  const alignMap: Record<string, string> = { MIN: "flex-start", CENTER: "center", MAX: "flex-end" }
  if (node.primaryAxisAlignItems && justifyMap[node.primaryAxisAlignItems]) css.push(`justify-content:${justifyMap[node.primaryAxisAlignItems]}`)
  if (node.counterAxisAlignItems && alignMap[node.counterAxisAlignItems]) css.push(`align-items:${alignMap[node.counterAxisAlignItems]}`)

  const b = node.absoluteBoundingBox
  if (node.layoutSizingHorizontal === "FILL") css.push("width:100%")
  else if (b?.width) css.push(`width:${Math.round(b.width)}px`, "max-width:100%")

  // Background
  const solidFill = node.fills?.find((f) => f.type === "SOLID" && f.visible !== false)
  if (solidFill?.color) css.push(`background:${rgbaStr(solidFill.color, solidFill.opacity)}`)

  if (node.cornerRadius) css.push(`border-radius:${node.cornerRadius}px`)
  if (node.clipsContent) css.push("overflow:hidden")
  if (node.opacity !== undefined && node.opacity < 1) css.push(`opacity:${node.opacity.toFixed(2)}`)

  const children = node.children
    .map((c) => convertAutoLayoutNode(c, depth + 1, imageMap))
    .filter(Boolean)
    .join("\n")

  const tag = depth === 0 ? "section" : "div"
  return `<${tag} style="${css.join(";")}">\n${children}\n</${tag}>`
}

// ── Collect image export IDs for auto-layout sections ──

function collectExportIds(node: FigmaNode): string[] {
  if (node.visible === false) return []
  if (node.type === "TEXT") return []

  // Shapes, vectors, images → export
  const shapeTypes = new Set(["VECTOR", "BOOLEAN_OPERATION", "STAR", "LINE", "ELLIPSE", "REGULAR_POLYGON"])
  if (shapeTypes.has(node.type)) return [node.id]
  if (node.fills?.some((f) => f.type === "IMAGE" && f.visible !== false)) return [node.id]

  // Frame with no text → export as image
  if (node.children && countTexts(node) === 0 && node.children.length > 0) return [node.id]

  // Recurse
  const ids: string[] = []
  for (const child of (node.children || [])) {
    ids.push(...collectExportIds(child))
  }
  return ids
}

// ── Main ───────────────────────────────────────────────

export async function figmaToHtml(
  figmaUrl: string,
  token: string
): Promise<{ html: string; css: string }> {
  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl)

  // 1. Fetch node tree
  const root = await fetchNode(fileKey, nodeId, token)
  const rootBounds = root.absoluteBoundingBox
  if (!rootBounds) throw new Error("Le node selectionne n'a pas de dimensions")

  const sections = root.children?.filter((c) => c.visible !== false) || []
  if (sections.length === 0) throw new Error("Aucune section trouvee dans le design")

  // 2. Determine which sections are auto-layout (editable) vs image-based
  const sectionImageIds: string[] = [] // sections to export as full images
  const autoLayoutExportIds: string[] = [] // shapes within auto-layout sections to export

  for (const section of sections) {
    const isAL = hasAutoLayout(section)
    const textCount = countTexts(section)

    if (isAL && textCount > 2) {
      // Auto-layout with meaningful text → convert to HTML, but export shapes
      autoLayoutExportIds.push(...collectExportIds(section))
    } else {
      // No auto-layout or too few texts → export as image
      sectionImageIds.push(section.id)
    }
  }

  // 3. Fetch all images in one batch
  const allImageIds = [...sectionImageIds, ...autoLayoutExportIds]
  const imageMap = await fetchImages(fileKey, allImageIds, token, 2)

  // Also fetch section images for text extraction
  const sectionTexts: Record<string, TextOverlay[]> = {}
  for (const section of sections) {
    if (sectionImageIds.includes(section.id)) {
      const sBounds = section.absoluteBoundingBox
      if (sBounds) {
        sectionTexts[section.id] = extractTexts(section, sBounds)
      }
    }
  }

  // 4. Build HTML for each section
  const htmlParts: string[] = []

  for (const section of sections) {
    const sBounds = section.absoluteBoundingBox
    if (!sBounds) continue

    if (sectionImageIds.includes(section.id) && imageMap[section.id]) {
      // Image-based section with text overlays
      const texts = sectionTexts[section.id] || []
      htmlParts.push(buildImageSection(sBounds, imageMap[section.id], texts, rootBounds.width))
    } else if (hasAutoLayout(section) && countTexts(section) > 2) {
      // Auto-layout section → editable HTML
      htmlParts.push(buildAutoLayoutSection(section, imageMap))
    } else if (imageMap[section.id]) {
      // Fallback: image
      htmlParts.push(buildImageSection(sBounds, imageMap[section.id], [], rootBounds.width))
    }
  }

  const html = htmlParts.join("\n\n")

  const css = [
    "/* Figma Import */",
    "section { margin: 0 auto; }",
    "img { max-width: 100%; height: auto; }",
    "h1, h2, h3, h4, p { margin: 0; }",
    "[data-figma-text] { transition: color 0.2s; }",
    "[data-figma-text]:hover { color: inherit !important; }",
  ].join("\n")

  return { html, css }
}
