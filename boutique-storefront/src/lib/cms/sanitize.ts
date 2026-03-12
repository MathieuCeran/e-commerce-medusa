import DOMPurify from "isomorphic-dompurify"
import { parse } from "node-html-parser"

// ── 1. Sanitize HTML — XSS protection ─────────────────────────────────────

const ALLOWED_DATA_ATTRS = [
  "data-component", "data-variant", "data-collection",
  "data-limit", "data-columns", "data-show-view-all",
  "data-url", "data-autoplay", "data-interval",
  "data-tab", "data-tab-panel", "data-target",
  "data-slide", "data-dot",
  "data-dismissible", "data-id", "data-dismiss",
  "data-slot", "data-tpl-locked", "data-tpl-block-id",
]

export function sanitizeCmsHtml(html: string): string {
  if (!html) return ""
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["style", "details", "summary"],
    ADD_ATTR: ALLOWED_DATA_ATTRS,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover", "onfocus", "onblur"],
  })
}

// ── 2. Strip GrapesJS internal artifacts ──────────────────────────────────

export function stripGjsArtifacts(html: string): string {
  if (!html) return ""

  const root = parse(html, { comment: true })

  root.querySelectorAll("*").forEach((node) => {
    // Remove data-gjs-* attributes
    Object.keys(node.attributes)
      .filter((attr) => attr.startsWith("data-gjs-"))
      .forEach((attr) => node.removeAttribute(attr))

    // Remove gjs-* classes
    const classAttr = node.getAttribute("class")
    if (classAttr) {
      const cleaned = classAttr
        .split(/\s+/)
        .filter((c) => !c.startsWith("gjs-"))
        .join(" ")
      if (cleaned.trim()) {
        node.setAttribute("class", cleaned)
      } else {
        node.removeAttribute("class")
      }
    }
  })

  return root.toString()
}

// ── 3. Scope CSS — prefix selectors with [data-cms-page="slug"] ──────────

function prefixSelectors(selectorGroup: string, scope: string): string {
  return selectorGroup
    .split(",")
    .map((s) => {
      const sel = s.trim()
      if (!sel) return sel
      if (sel === "body" || sel === "html" || sel === "*") return scope
      return `${scope} ${sel}`
    })
    .join(", ")
}

export function scopeCmsCss(css: string, slug: string): string {
  if (!css?.trim()) return ""

  const escapedSlug = slug.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  const scope = `[data-cms-page="${escapedSlug}"]`

  const result: string[] = []
  let i = 0
  // Track nesting: 0 = top-level, 1+ = inside a rule or at-rule block
  let depth = 0
  // Whether we're inside @keyframes (don't scope inner selectors like "from", "to", "50%")
  let keyframesDepth = -1
  // Whether we're inside @media or similar (scope inner selectors normally)
  let atRuleDepth = -1

  while (i < css.length) {
    // Skip whitespace at current position (preserve it)
    if (/\s/.test(css[i])) {
      result.push(css[i])
      i++
      continue
    }

    // Handle comments
    if (css[i] === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2)
      if (end === -1) {
        result.push(css.slice(i))
        break
      }
      result.push(css.slice(i, end + 2))
      i = end + 2
      continue
    }

    // Handle closing brace
    if (css[i] === "}") {
      result.push("}")
      depth--
      if (depth < 0) depth = 0
      if (keyframesDepth >= 0 && depth <= keyframesDepth) keyframesDepth = -1
      if (atRuleDepth >= 0 && depth <= atRuleDepth) atRuleDepth = -1
      i++
      continue
    }

    // Read until next { or } (respecting comments and string literals)
    let chunk = ""
    while (i < css.length && css[i] !== "{" && css[i] !== "}") {
      // Handle comments inside selectors/values
      if (css[i] === "/" && css[i + 1] === "*") {
        const end = css.indexOf("*/", i + 2)
        if (end === -1) {
          chunk += css.slice(i)
          i = css.length
          break
        }
        chunk += css.slice(i, end + 2)
        i = end + 2
        continue
      }
      // Handle string literals (skip content: "{ }" etc.)
      if (css[i] === '"' || css[i] === "'") {
        const quote = css[i]
        chunk += quote
        i++
        while (i < css.length && css[i] !== quote) {
          if (css[i] === "\\" && i + 1 < css.length) {
            chunk += css[i] + css[i + 1]
            i += 2
          } else {
            chunk += css[i]
            i++
          }
        }
        if (i < css.length) {
          chunk += css[i] // closing quote
          i++
        }
        continue
      }
      chunk += css[i]
      i++
    }

    if (i >= css.length) {
      // Leftover text with no brace
      if (chunk) result.push(chunk)
      break
    }

    // Hit a closing brace — chunk contains CSS properties, push them
    if (css[i] === "}") {
      if (chunk) result.push(chunk)
      // Don't advance i — the outer loop handles "}"
      continue
    }

    if (css[i] === "{") {
      const trimmedChunk = chunk.trim()

      // Detect @keyframes
      if (/^@(-webkit-)?keyframes\s/.test(trimmedChunk)) {
        result.push(chunk + "{")
        depth++
        keyframesDepth = depth - 1
        i++
        continue
      }

      // Detect other at-rules (@media, @supports, @layer, etc.)
      if (trimmedChunk.startsWith("@")) {
        result.push(chunk + "{")
        depth++
        atRuleDepth = depth - 1
        i++
        continue
      }

      // Inside @keyframes — don't scope (these are "from", "to", "50%" etc.)
      if (keyframesDepth >= 0) {
        result.push(chunk + "{")
        depth++
        i++
        continue
      }

      // Normal selector — scope it
      const scoped = prefixSelectors(trimmedChunk, scope)
      result.push(scoped + " {")
      depth++
      i++
      continue
    }
  }

  return result.join("")
}
