# CMS Blocks Library & Hydration Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 14 new GrapeJS blocks (navigation, media, interactive), build a generic component hydration pipeline on the storefront, and fix existing incoherences.

**Architecture:** GrapeJS blocks produce HTML with `data-component` attributes. The storefront uses `node-html-parser` to detect these markers and replaces them with real React components. Header/footer are client components hydrated with Medusa data.

**Tech Stack:** GrapeJS (admin editor), Next.js 14 RSC (storefront), node-html-parser, @medusajs/ui, React 18

**Spec:** `docs/superpowers/specs/2026-03-12-cms-blocks-and-hydration-design.md`

---

## File Map

### New files — Storefront hydration pipeline
| File | Responsibility |
|------|---------------|
| `boutique-storefront/src/lib/cms/component-registry.ts` | Maps `data-component` names → React components + server data fns |
| `boutique-storefront/src/lib/cms/hydrate-components.ts` | Parses HTML, extracts component markers, returns segments |
| `boutique-storefront/src/lib/cms/cms-page-renderer.tsx` | RSC that renders CMS HTML with hydrated React components |
| `boutique-storefront/src/lib/cms/components/products-grid-server.tsx` | Moved from `[...slug]/` |
| `boutique-storefront/src/lib/cms/components/site-header.tsx` | Client component — hydrated header |
| `boutique-storefront/src/lib/cms/components/site-footer.tsx` | Client component — hydrated footer |
| `boutique-storefront/src/lib/cms/components/video-embed.tsx` | Client component — lazy iframe |
| `boutique-storefront/src/lib/cms/components/tabs.tsx` | Client component — tab switching |
| `boutique-storefront/src/lib/cms/components/stats-counter.tsx` | Client component — animated counters |
| `boutique-storefront/src/lib/cms/components/testimonials-carousel.tsx` | Client component — auto-play slider |
| `boutique-storefront/src/lib/cms/components/announcement-bar.tsx` | Client component — dismissible banner |

### New files — Admin GrapeJS blocks
| File | Responsibility |
|------|---------------|
| `boutique/src/admin/lib/grapes/blocks/navigation.ts` | 3 header + 2 footer blocks |
| `boutique/src/admin/lib/grapes/blocks/media.ts` | image, video-embed, gallery, logo-cloud |
| `boutique/src/admin/lib/grapes/blocks/interactive.ts` | accordion, tabs, stats, carousel, announcement |

### Modified files
| File | Change |
|------|--------|
| `boutique/src/admin/lib/grapes/blocks/index.ts` | Register new block files |
| `boutique/src/admin/lib/grapes/blocks/basic.ts` | Remove image-block (moved to media) |
| `boutique/src/admin/lib/grapes/editor/EditorSidebar.tsx` | Remove "forms" category |
| `boutique-storefront/src/app/[countryCode]/(main)/page.tsx` | Use CmsPageRenderer |
| `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx` | Use CmsPageRenderer |
| `boutique-storefront/src/lib/data/cms-layout-merge.ts` | Smart Nav/Footer hiding |

### Files to remove
| File | Reason |
|------|--------|
| `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/gjs-renderer.tsx` | Replaced by CmsPageRenderer |
| `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/products-grid-server.tsx` | Moved to `lib/cms/components/` |

---

## Chunk 1: Core Hydration Pipeline (Storefront)

This chunk builds the generic hydration infrastructure and migrates the existing products-grid to it.

### Task 1: Install node-html-parser

**Files:**
- Modify: `boutique-storefront/package.json`

- [ ] **Step 1: Install dependency**

```bash
cd boutique-storefront && npm install node-html-parser
```

- [ ] **Step 2: Verify installation**

```bash
node -e "const { parse } = require('node-html-parser'); console.log(parse('<div data-component=\"test\">ok</div>').querySelector('[data-component]').getAttribute('data-component'))"
```

Expected: `test`

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/package.json boutique-storefront/package-lock.json
git commit -m "chore: add node-html-parser dependency for CMS hydration pipeline"
```

---

### Task 2: Create hydrate-components.ts

**Files:**
- Create: `boutique-storefront/src/lib/cms/hydrate-components.ts`

- [ ] **Step 1: Create the HTML parser module**

```typescript
import { parse } from "node-html-parser"

export type HtmlSegment = { type: "html"; content: string }
export type ComponentSegment = {
  type: "component"
  name: string
  attrs: Record<string, string>
  innerHTML: string
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

    components.push({ marker, name, attrs, innerHTML: node.innerHTML })
    node.replaceWith(marker)
  })

  const markedHtml = root.toString()
  const segments: Segment[] = []
  let remaining = markedHtml

  for (const comp of components) {
    const idx = remaining.indexOf(comp.marker)
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd boutique-storefront && npx tsc --noEmit src/lib/cms/hydrate-components.ts 2>&1 | grep -v node_modules | head -20
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/hydrate-components.ts
git commit -m "feat(cms): add generic HTML parser for component hydration"
```

---

### Task 3: Create component-registry.ts

**Files:**
- Create: `boutique-storefront/src/lib/cms/component-registry.ts`

- [ ] **Step 1: Create the registry**

```typescript
import { ComponentType } from "react"
import { StoreRegion } from "@medusajs/types"

export type RenderContext = {
  region: StoreRegion
  countryCode: string
}

export type ComponentEntry = {
  component: ComponentType<any>
  /**
   * Optional async function to fetch server-side data during SSR.
   * The returned object is spread as props on the component.
   */
  serverDataFn?: (
    attrs: Record<string, string>,
    context: RenderContext
  ) => Promise<Record<string, any>>
}

const registry: Record<string, ComponentEntry> = {}

export function registerComponent(name: string, entry: ComponentEntry) {
  registry[name] = entry
}

export function getComponent(name: string): ComponentEntry | undefined {
  return registry[name]
}

export function getAllRegisteredNames(): string[] {
  return Object.keys(registry)
}
```

- [ ] **Step 2: Commit**

```bash
git add boutique-storefront/src/lib/cms/component-registry.ts
git commit -m "feat(cms): add component registry for hydration pipeline"
```

---

### Task 4: Move products-grid-server and register it

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/products-grid-server.tsx` (moved)
- Create: `boutique-storefront/src/lib/cms/register-components.ts`

- [ ] **Step 1: Copy products-grid-server to new location**

Copy `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/products-grid-server.tsx` to `boutique-storefront/src/lib/cms/components/products-grid-server.tsx`. Keep the exact same content — only update import paths if needed.

Read the file at its current location to get the exact content, then write it to the new location with corrected import paths.

- [ ] **Step 2: Create register-components.ts with products-grid**

This file imports all hydrated components and registers them. Start with just products-grid; we'll add others in later tasks.

```typescript
import { registerComponent, type RenderContext } from "./component-registry"
import ProductsGridServer from "./components/products-grid-server"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"

async function fetchProductsGridData(
  attrs: Record<string, string>,
  context: RenderContext
): Promise<Record<string, any>> {
  const collection = attrs["data-collection"] || ""
  const limit = parseInt(attrs["data-limit"] || "4", 10)
  const columns = attrs["data-columns"] || "4"
  const showViewAll = attrs["data-show-view-all"] === "true"

  if (!collection) {
    return { products: [], region: context.region, columns, collection, showViewAll }
  }

  try {
    const { response } = await listProducts({
      queryParams: {
        collection_id: [collection],
        limit,
      },
      countryCode: context.countryCode,
    })

    return {
      products: response.products || [],
      region: context.region,
      columns,
      collection,
      showViewAll,
    }
  } catch {
    return { products: [], region: context.region, columns, collection, showViewAll }
  }
}

export function registerAllComponents() {
  registerComponent("products-grid", {
    component: ProductsGridServer,
    serverDataFn: fetchProductsGridData,
  })
}
```

> **Note:** The exact import paths for `listProducts`, `getRegion` etc. must match the existing storefront patterns. Check the existing `[...slug]/page.tsx` for the exact import paths used.

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/products-grid-server.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): migrate products-grid to component registry"
```

---

### Task 5: Create cms-page-renderer.tsx

**Files:**
- Create: `boutique-storefront/src/lib/cms/cms-page-renderer.tsx`

- [ ] **Step 1: Create the server component renderer**

This is an async RSC (React Server Component). It:
1. Merges layout if present
2. Detects site-header/site-footer for smart Nav/Footer hiding
3. Extracts components via `extractComponents()`
4. Calls `serverDataFn` for each component
5. Renders the segments

```typescript
import { mergeLayoutWithContent, HIDE_DEFAULT_NAV_FOOTER_CSS } from "@lib/data/cms-layout-merge"
import { extractComponents, hasComponent, type Segment } from "./hydrate-components"
import { getComponent, type RenderContext } from "./component-registry"
import { registerAllComponents } from "./register-components"

// Ensure components are registered
registerAllComponents()

type CmsPageRendererProps = {
  html: string
  css: string
  layout?: { html: string; css: string } | null
  context: RenderContext
  isPreview?: boolean
}

export async function CmsPageRenderer({
  html,
  css,
  layout,
  context,
  isPreview,
}: CmsPageRendererProps) {
  // 1. Merge layout with page content
  let finalHtml = html
  let finalCss = css

  if (layout) {
    const merged = mergeLayoutWithContent(layout, html, css)
    finalHtml = merged.html
    finalCss = merged.css
  }

  // 2. Detect if layout provides its own header/footer
  const hasCustomHeader = hasComponent(finalHtml, "site-header")
  const hasCustomFooter = hasComponent(finalHtml, "site-footer")
  const hideDefaultNav = hasCustomHeader || hasCustomFooter

  // 3. Extract component segments
  const segments = extractComponents(finalHtml)

  // 4. Resolve server data for each component segment
  const resolvedSegments = await Promise.all(
    segments.map(async (segment) => {
      if (segment.type === "html") return segment

      const entry = getComponent(segment.name)
      if (!entry) {
        // Unknown component — render as static HTML
        return { type: "html" as const, content: segment.innerHTML }
      }

      let serverData: Record<string, any> = {}
      if (entry.serverDataFn) {
        try {
          serverData = await entry.serverDataFn(segment.attrs, context)
        } catch (err) {
          console.error(`[CMS] serverDataFn failed for "${segment.name}":`, err)
          // Fallback: render raw innerHTML
          return { type: "html" as const, content: segment.innerHTML }
        }
      }

      return {
        type: "resolved-component" as const,
        name: segment.name,
        component: entry.component,
        props: { ...segment.attrs, ...serverData },
      }
    })
  )

  // 5. Render
  return (
    <div data-cms-full-layout={hideDefaultNav ? "true" : undefined}>
      {hideDefaultNav && <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />}
      {finalCss && <style dangerouslySetInnerHTML={{ __html: finalCss }} />}

      {resolvedSegments.map((segment, i) => {
        if (segment.type === "html") {
          return (
            <div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: segment.content }} />
          )
        }

        if (segment.type === "resolved-component") {
          const Component = segment.component
          return <Component key={`comp-${segment.name}-${i}`} {...segment.props} />
        }

        return null
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd boutique-storefront && npx tsc --noEmit src/lib/cms/cms-page-renderer.tsx 2>&1 | grep -v node_modules | head -20
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/cms-page-renderer.tsx
git commit -m "feat(cms): add CmsPageRenderer server component"
```

---

### Task 6: Update storefront page routes to use CmsPageRenderer

**Files:**
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx`
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/page.tsx`

- [ ] **Step 1: Refactor `[...slug]/page.tsx`**

Replace the entire products-grid extraction logic, GjsRenderer usage, and HTML interleaving with a single `<CmsPageRenderer>` call. Keep the slug parsing, 404 logic, preview detection, and metadata generation as-is.

Read the current file, then replace:
- Remove imports of `GjsRenderer` and `ProductsGridServer`
- Remove `extractProductsGrids()` function
- Remove product fetching loop and marker replacement
- Remove HTML splitting and interleaving logic
- Add import of `CmsPageRenderer` from `@lib/cms/cms-page-renderer`
- Replace render section with:

```tsx
<CmsPageRenderer
  html={gjsHtml}
  css={gjsCss}
  layout={layout}
  context={{ region, countryCode: params.countryCode }}
  isPreview={!!previewToken}
/>
```

Also render the preview banner before `CmsPageRenderer` if in preview mode.

- [ ] **Step 2: Refactor homepage `page.tsx`**

Same pattern. Replace:
- Remove broken imports from `./page/[slug]/gjs-renderer` and `./page/[slug]/products-grid-server`
- Remove `extractProductsGrids()` function
- Remove product fetching and interleaving
- Add import of `CmsPageRenderer`
- Replace render section with `<CmsPageRenderer>` call
- Keep the fallback to `<Hero>` + `<FeaturedProducts>` when no CMS page exists

- [ ] **Step 3: Delete old files**

```bash
rm boutique-storefront/src/app/[countryCode]/(main)/[...slug]/gjs-renderer.tsx
rm boutique-storefront/src/app/[countryCode]/(main)/[...slug]/products-grid-server.tsx
```

- [ ] **Step 4: Verify build**

```bash
cd boutique-storefront && npm run build 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(cms): replace ad-hoc rendering with CmsPageRenderer

Fixes homepage import bug (wrong path to gjs-renderer).
Fixes CSS double-injection.
Removes duplicated products-grid extraction logic."
```

---

### Task 7: Update cms-layout-merge for smart Nav/Footer detection

**Files:**
- Modify: `boutique-storefront/src/lib/data/cms-layout-merge.ts`

- [ ] **Step 1: Update the layout merge module**

The current `HIDE_DEFAULT_NAV_FOOTER_CSS` is used blindly. The `CmsPageRenderer` now handles detection, so the CSS constant stays but the logic in `cms-page-renderer.tsx` is what decides when to apply it. No changes needed to the merge module itself — the smart detection is already in `CmsPageRenderer` (Task 5).

Verify the `HIDE_DEFAULT_NAV_FOOTER_CSS` export is still correct and matches the `data-site-nav` / `data-site-footer` attributes used in `layout.tsx`.

- [ ] **Step 2: Commit (if changes needed)**

```bash
git add boutique-storefront/src/lib/data/cms-layout-merge.ts
git commit -m "fix(cms): verify layout merge compatibility with new renderer"
```

---

## Chunk 2: GrapeJS Blocks (Admin)

This chunk adds all 14 new blocks and cleans up the sidebar.

### Task 8: Create navigation blocks

**Files:**
- Create: `boutique/src/admin/lib/grapes/blocks/navigation.ts`

- [ ] **Step 1: Create navigation.ts with 3 headers + 2 footers**

Follow the pattern from `ecommerce.ts`: `bm.add()` for block registration + `editor.DomComponents.addType()` for component types with traits.

```typescript
import type { Editor } from "grapesjs"

export function registerNavigationBlocks(editor: Editor) {
  const bm = editor.BlockManager

  // --- HEADERS ---

  bm.add("header-simple", {
    label: "Header Simple",
    category: "Navigation",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="4" rx="1"/><line x1="4" y1="6" x2="8" y2="6"/><line x1="12" y1="6" x2="14" y2="6"/><line x1="16" y1="6" x2="18" y2="6"/><line x1="20" y1="6" x2="20" y2="6"/></svg>`,
    content: `<header data-component="site-header" data-variant="simple" style="display:flex;align-items:center;justify-content:space-between;padding:16px 40px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <a href="/" style="font-size:20px;font-weight:700;color:#111;text-decoration:none;">VotreLogo</a>
      <nav style="display:flex;gap:24px;">
        <a href="#" style="color:#374151;text-decoration:none;font-size:14px;font-weight:500;">Boutique</a>
        <a href="#" style="color:#374151;text-decoration:none;font-size:14px;font-weight:500;">A propos</a>
        <a href="#" style="color:#374151;text-decoration:none;font-size:14px;font-weight:500;">Contact</a>
      </nav>
      <a href="#" style="background:#111;color:#fff;padding:8px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Acheter</a>
    </header>`,
  })

  bm.add("header-ecommerce", {
    label: "Header E-commerce",
    category: "Navigation",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="4" rx="1"/><circle cx="18" cy="6" r="1"/><circle cx="20" cy="6" r="1"/><line x1="4" y1="6" x2="8" y2="6"/></svg>`,
    content: `<header data-component="site-header" data-variant="ecommerce" style="display:flex;align-items:center;justify-content:space-between;padding:12px 40px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <a href="/" style="font-size:20px;font-weight:700;color:#111;text-decoration:none;">VotreLogo</a>
      <nav style="display:flex;gap:24px;">
        <a href="#" style="color:#374151;text-decoration:none;font-size:14px;font-weight:500;">Boutique</a>
        <a href="#" style="color:#374151;text-decoration:none;font-size:14px;font-weight:500;">Collections</a>
        <a href="#" style="color:#374151;text-decoration:none;font-size:14px;font-weight:500;">Nouveautes</a>
      </nav>
      <div style="display:flex;align-items:center;gap:16px;">
        <span data-slot="search" style="color:#6b7280;font-size:13px;cursor:pointer;">Recherche</span>
        <span data-slot="account" style="color:#6b7280;font-size:13px;cursor:pointer;">Compte</span>
        <span data-slot="cart" style="color:#6b7280;font-size:13px;cursor:pointer;">Panier (0)</span>
      </div>
    </header>`,
  })

  bm.add("header-minimal", {
    label: "Header Minimal",
    category: "Navigation",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="4" rx="1"/><line x1="4" y1="6" x2="6" y2="6"/><line x1="11" y1="6" x2="13" y2="6"/><line x1="19" y1="6" x2="20" y2="6"/></svg>`,
    content: `<header data-component="site-header" data-variant="minimal" style="display:flex;align-items:center;justify-content:space-between;padding:16px 40px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <span data-slot="menu-toggle" style="cursor:pointer;font-size:13px;color:#6b7280;">Menu</span>
      <a href="/" style="font-size:22px;font-weight:700;color:#111;text-decoration:none;position:absolute;left:50%;transform:translateX(-50%);">VotreLogo</a>
      <span data-slot="cart" style="color:#6b7280;font-size:13px;cursor:pointer;">Panier (0)</span>
    </header>`,
  })

  // --- FOOTERS ---

  bm.add("footer-full", {
    label: "Footer Complet",
    category: "Navigation",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="16" width="20" height="4" rx="1"/><line x1="4" y1="18" x2="7" y2="18"/><line x1="9" y1="18" x2="12" y2="18"/><line x1="14" y1="18" x2="17" y2="18"/><line x1="19" y1="18" x2="20" y2="18"/></svg>`,
    content: `<footer data-component="site-footer" data-variant="full" style="background:#111827;color:#d1d5db;padding:64px 40px 24px;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:40px;max-width:1200px;margin:0 auto;">
        <div>
          <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:12px;">VotreLogo</div>
          <p style="font-size:14px;line-height:1.6;color:#9ca3af;">Description de votre boutique. Qualite et service depuis 2024.</p>
        </div>
        <div>
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">Boutique</h4>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">Nouveautes</a>
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">Collections</a>
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">Promotions</a>
          </div>
        </div>
        <div>
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">Informations</h4>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">A propos</a>
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">Livraison</a>
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">CGV</a>
          </div>
        </div>
        <div>
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">Suivez-nous</h4>
          <div style="display:flex;gap:12px;">
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">Instagram</a>
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">Facebook</a>
            <a href="#" style="color:#9ca3af;text-decoration:none;font-size:14px;">TikTok</a>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid #374151;margin-top:40px;padding-top:20px;text-align:center;max-width:1200px;margin-left:auto;margin-right:auto;">
        <p style="font-size:13px;color:#6b7280;">© 2026 Votre Boutique. Tous droits reserves.</p>
      </div>
    </footer>`,
  })

  bm.add("footer-minimal", {
    label: "Footer Minimal",
    category: "Navigation",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="18" width="20" height="2" rx="1"/><line x1="8" y1="19" x2="16" y2="19"/></svg>`,
    content: `<footer data-component="site-footer" data-variant="minimal" style="display:flex;align-items:center;justify-content:space-between;padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <span style="font-size:16px;font-weight:600;color:#111;">VotreLogo</span>
      <nav style="display:flex;gap:20px;">
        <a href="#" style="color:#6b7280;text-decoration:none;font-size:13px;">CGV</a>
        <a href="#" style="color:#6b7280;text-decoration:none;font-size:13px;">Confidentialite</a>
        <a href="#" style="color:#6b7280;text-decoration:none;font-size:13px;">Contact</a>
      </nav>
      <p style="font-size:13px;color:#9ca3af;">© 2026</p>
    </footer>`,
  })

  // --- Component types for hydration detection ---

  editor.DomComponents.addType("site-header", {
    isComponent: (el) => el?.getAttribute?.("data-component") === "site-header",
    model: {
      defaults: {
        tagName: "header",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { value: "simple", name: "Simple" },
              { value: "ecommerce", name: "E-commerce" },
              { value: "minimal", name: "Minimal" },
            ],
          },
        ],
      },
    },
  })

  editor.DomComponents.addType("site-footer", {
    isComponent: (el) => el?.getAttribute?.("data-component") === "site-footer",
    model: {
      defaults: {
        tagName: "footer",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { value: "full", name: "Complet" },
              { value: "minimal", name: "Minimal" },
            ],
          },
        ],
      },
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add boutique/src/admin/lib/grapes/blocks/navigation.ts
git commit -m "feat(cms): add navigation blocks (3 headers + 2 footers)"
```

---

### Task 9: Create media blocks

**Files:**
- Create: `boutique/src/admin/lib/grapes/blocks/media.ts`
- Modify: `boutique/src/admin/lib/grapes/blocks/basic.ts` (remove image-block)

- [ ] **Step 1: Create media.ts**

```typescript
import type { Editor } from "grapesjs"

export function registerMediaBlocks(editor: Editor) {
  const bm = editor.BlockManager

  // image-block (moved from basic.ts)
  bm.add("image-block", {
    label: "Image",
    category: "Media",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
    content: `<figure style="margin:0;padding:24px 0;text-align:center;">
      <img src="https://placehold.co/800x400/e2e8f0/94a3b8?text=Image" alt="Image" style="max-width:100%;height:auto;border-radius:8px;" />
      <figcaption style="margin-top:8px;font-size:13px;color:#6b7280;">Legende de l'image</figcaption>
    </figure>`,
  })

  // video-embed (hydrated)
  bm.add("video-embed", {
    label: "Video",
    category: "Media",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>`,
    content: `<div data-component="video-embed" data-url="" data-autoplay="false" style="position:relative;padding:56.25% 0 0 0;background:#0f172a;border-radius:8px;overflow:hidden;">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:14px;">
        <div style="text-align:center;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 8px;"><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="10"/></svg>
          <p style="margin:0;">Configurez l'URL de la video dans les parametres</p>
        </div>
      </div>
    </div>`,
  })

  // image-gallery (static)
  bm.add("image-gallery", {
    label: "Galerie",
    category: "Media",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>`,
    content: `<div data-columns="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:40px;">
      <figure style="margin:0;"><img src="https://placehold.co/400x300/e2e8f0/94a3b8?text=1" alt="Image 1" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:4/3;" /></figure>
      <figure style="margin:0;"><img src="https://placehold.co/400x300/e2e8f0/94a3b8?text=2" alt="Image 2" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:4/3;" /></figure>
      <figure style="margin:0;"><img src="https://placehold.co/400x300/e2e8f0/94a3b8?text=3" alt="Image 3" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:4/3;" /></figure>
      <figure style="margin:0;"><img src="https://placehold.co/400x300/e2e8f0/94a3b8?text=4" alt="Image 4" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:4/3;" /></figure>
      <figure style="margin:0;"><img src="https://placehold.co/400x300/e2e8f0/94a3b8?text=5" alt="Image 5" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:4/3;" /></figure>
      <figure style="margin:0;"><img src="https://placehold.co/400x300/e2e8f0/94a3b8?text=6" alt="Image 6" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:4/3;" /></figure>
    </div>`,
  })

  // logo-cloud (static)
  bm.add("logo-cloud", {
    label: "Logo Cloud",
    category: "Media",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="6" height="4" rx="1"/><rect x="9" y="6" width="6" height="4" rx="1"/><rect x="16" y="6" width="6" height="4" rx="1"/><rect x="5" y="13" width="6" height="4" rx="1"/><rect x="13" y="13" width="6" height="4" rx="1"/></svg>`,
    content: `<section style="padding:48px 40px;text-align:center;">
      <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;margin-bottom:32px;">Ils nous font confiance</h3>
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:40px;opacity:0.5;filter:grayscale(100%);">
        <img src="https://placehold.co/120x40/e2e8f0/94a3b8?text=Brand+1" alt="Brand 1" style="height:32px;width:auto;" />
        <img src="https://placehold.co/120x40/e2e8f0/94a3b8?text=Brand+2" alt="Brand 2" style="height:32px;width:auto;" />
        <img src="https://placehold.co/120x40/e2e8f0/94a3b8?text=Brand+3" alt="Brand 3" style="height:32px;width:auto;" />
        <img src="https://placehold.co/120x40/e2e8f0/94a3b8?text=Brand+4" alt="Brand 4" style="height:32px;width:auto;" />
        <img src="https://placehold.co/120x40/e2e8f0/94a3b8?text=Brand+5" alt="Brand 5" style="height:32px;width:auto;" />
        <img src="https://placehold.co/120x40/e2e8f0/94a3b8?text=Brand+6" alt="Brand 6" style="height:32px;width:auto;" />
      </div>
    </section>`,
  })

  // --- Component type for video-embed ---

  editor.DomComponents.addType("video-embed", {
    isComponent: (el) => el?.getAttribute?.("data-component") === "video-embed",
    model: {
      defaults: {
        droppable: false,
        traits: [
          { type: "text", name: "data-url", label: "URL Video (YouTube/Vimeo)", placeholder: "https://youtube.com/watch?v=..." },
          { type: "checkbox", name: "data-autoplay", label: "Lecture automatique" },
        ],
        resizable: {
          tl: 0, tr: 0, bl: 0, br: 0,
          tc: 0, bc: 1, cl: 0, cr: 0,
        },
      },
    },
  })
}
```

- [ ] **Step 2: Remove image-block from basic.ts**

In `boutique/src/admin/lib/grapes/blocks/basic.ts`, remove the `bm.add("image-block", {...})` block (approximately lines 25-33). Keep heading, rich-text, spacer, divider.

- [ ] **Step 3: Commit**

```bash
git add boutique/src/admin/lib/grapes/blocks/media.ts boutique/src/admin/lib/grapes/blocks/basic.ts
git commit -m "feat(cms): add media blocks (image, video, gallery, logo-cloud)"
```

---

### Task 10: Create interactive blocks

**Files:**
- Create: `boutique/src/admin/lib/grapes/blocks/interactive.ts`

- [ ] **Step 1: Create interactive.ts with 5 blocks**

```typescript
import type { Editor } from "grapesjs"

export function registerInteractiveBlocks(editor: Editor) {
  const bm = editor.BlockManager

  // accordion (static — native <details>)
  bm.add("accordion", {
    label: "Accordion",
    category: "Interactive",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/><path d="M17 6l-2 0" /><path d="M17 12l-2 0" /><path d="M17 18l-2 0" /></svg>`,
    content: `<div style="max-width:700px;margin:40px auto;padding:0 24px;">
      <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
        <summary style="font-size:16px;font-weight:500;cursor:pointer;color:#111827;">Question 1</summary>
        <p style="margin-top:8px;font-size:14px;color:#6b7280;line-height:1.6;">Reponse detaillee a la premiere question.</p>
      </details>
      <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
        <summary style="font-size:16px;font-weight:500;cursor:pointer;color:#111827;">Question 2</summary>
        <p style="margin-top:8px;font-size:14px;color:#6b7280;line-height:1.6;">Reponse detaillee a la deuxieme question.</p>
      </details>
      <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
        <summary style="font-size:16px;font-weight:500;cursor:pointer;color:#111827;">Question 3</summary>
        <p style="margin-top:8px;font-size:14px;color:#6b7280;line-height:1.6;">Reponse detaillee a la troisieme question.</p>
      </details>
    </div>`,
  })

  // tabs (hydrated)
  bm.add("tabs", {
    label: "Onglets",
    category: "Interactive",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M3 7h6V4h6v3"/></svg>`,
    content: `<div data-component="tabs" style="max-width:800px;margin:40px auto;padding:0 24px;">
      <div style="display:flex;gap:0;border-bottom:2px solid #e5e7eb;">
        <button data-tab="0" style="padding:10px 20px;font-size:14px;font-weight:500;color:#111;border-bottom:2px solid #111;margin-bottom:-2px;background:none;border-top:none;border-left:none;border-right:none;cursor:pointer;">Onglet 1</button>
        <button data-tab="1" style="padding:10px 20px;font-size:14px;font-weight:500;color:#6b7280;background:none;border:none;cursor:pointer;">Onglet 2</button>
        <button data-tab="2" style="padding:10px 20px;font-size:14px;font-weight:500;color:#6b7280;background:none;border:none;cursor:pointer;">Onglet 3</button>
      </div>
      <div style="padding:24px 0;">
        <div data-tab-panel="0">
          <h3 style="font-size:18px;font-weight:600;color:#111;margin-bottom:8px;">Contenu du premier onglet</h3>
          <p style="font-size:14px;color:#6b7280;line-height:1.6;">Decrivez le contenu de ce panneau ici.</p>
        </div>
        <div data-tab-panel="1" style="display:none;">
          <h3 style="font-size:18px;font-weight:600;color:#111;margin-bottom:8px;">Contenu du deuxieme onglet</h3>
          <p style="font-size:14px;color:#6b7280;line-height:1.6;">Decrivez le contenu de ce panneau ici.</p>
        </div>
        <div data-tab-panel="2" style="display:none;">
          <h3 style="font-size:18px;font-weight:600;color:#111;margin-bottom:8px;">Contenu du troisieme onglet</h3>
          <p style="font-size:14px;color:#6b7280;line-height:1.6;">Decrivez le contenu de ce panneau ici.</p>
        </div>
      </div>
    </div>`,
  })

  // stats-counter (hydrated)
  bm.add("stats-counter", {
    label: "Compteurs",
    category: "Interactive",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 20V10"/><path d="M9 20V4"/><path d="M15 20V14"/><path d="M21 20V8"/></svg>`,
    content: `<section data-component="stats-counter" style="padding:64px 40px;background:#f9fafb;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px;max-width:800px;margin:0 auto;text-align:center;">
        <div>
          <span data-target="1500" style="font-size:48px;font-weight:700;color:#111827;display:block;">1500</span>
          <span style="font-size:14px;color:#6b7280;margin-top:4px;display:block;">Clients satisfaits</span>
        </div>
        <div>
          <span data-target="300" style="font-size:48px;font-weight:700;color:#111827;display:block;">300</span>
          <span style="font-size:14px;color:#6b7280;margin-top:4px;display:block;">Produits</span>
        </div>
        <div>
          <span data-target="50" style="font-size:48px;font-weight:700;color:#111827;display:block;">50</span>
          <span style="font-size:14px;color:#6b7280;margin-top:4px;display:block;">Pays livres</span>
        </div>
      </div>
    </section>`,
  })

  // testimonials-carousel (hydrated)
  bm.add("testimonials-carousel", {
    label: "Temoignages",
    category: "Interactive",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/><rect x="7" y="8" width="10" height="8" rx="1"/></svg>`,
    content: `<section data-component="testimonials-carousel" data-autoplay="true" data-interval="5000" style="padding:64px 40px;background:#ffffff;text-align:center;">
      <h2 style="font-size:28px;font-weight:700;color:#111827;margin-bottom:40px;">Ce que disent nos clients</h2>
      <div style="max-width:600px;margin:0 auto;">
        <div class="testimonial-slide">
          <blockquote style="font-size:18px;font-style:italic;color:#374151;line-height:1.6;margin:0;">"Excellent service et produits de qualite. Je recommande vivement."</blockquote>
          <cite style="display:block;margin-top:16px;font-size:14px;font-weight:600;color:#111827;font-style:normal;">Marie D.</cite>
        </div>
        <div class="testimonial-slide" style="display:none;">
          <blockquote style="font-size:18px;font-style:italic;color:#374151;line-height:1.6;margin:0;">"Livraison rapide et emballage soigne. Tres satisfait de mon achat."</blockquote>
          <cite style="display:block;margin-top:16px;font-size:14px;font-weight:600;color:#111827;font-style:normal;">Pierre L.</cite>
        </div>
        <div class="testimonial-slide" style="display:none;">
          <blockquote style="font-size:18px;font-style:italic;color:#374151;line-height:1.6;margin:0;">"Le meilleur e-commerce que j'ai teste. Interface claire et produits au top."</blockquote>
          <cite style="display:block;margin-top:16px;font-size:14px;font-weight:600;color:#111827;font-style:normal;">Sophie M.</cite>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:8px;margin-top:24px;">
        <span style="width:8px;height:8px;border-radius:50%;background:#111827;display:inline-block;"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:#d1d5db;display:inline-block;"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:#d1d5db;display:inline-block;"></span>
      </div>
    </section>`,
  })

  // announcement-bar (hydrated)
  bm.add("announcement-bar", {
    label: "Bandeau d'annonce",
    category: "Interactive",
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="9" width="20" height="6" rx="1"/><line x1="12" y1="11" x2="12" y2="13"/></svg>`,
    content: `<div data-component="announcement-bar" data-dismissible="true" data-id="promo-1" style="background:#111827;color:#ffffff;padding:10px 40px;text-align:center;font-size:13px;font-weight:500;position:relative;">
      <p style="margin:0;">Livraison offerte des 50EUR d'achat — Code : BIENVENUE</p>
    </div>`,
  })

  // --- Component types ---

  editor.DomComponents.addType("tabs", {
    isComponent: (el) => el?.getAttribute?.("data-component") === "tabs",
    model: { defaults: { droppable: true } },
  })

  editor.DomComponents.addType("stats-counter", {
    isComponent: (el) => el?.getAttribute?.("data-component") === "stats-counter",
    model: { defaults: { droppable: true } },
  })

  editor.DomComponents.addType("testimonials-carousel", {
    isComponent: (el) => el?.getAttribute?.("data-component") === "testimonials-carousel",
    model: {
      defaults: {
        droppable: true,
        traits: [
          { type: "checkbox", name: "data-autoplay", label: "Lecture automatique" },
          { type: "number", name: "data-interval", label: "Intervalle (ms)", placeholder: "5000", min: 1000, max: 15000, step: 500 },
        ],
      },
    },
  })

  editor.DomComponents.addType("announcement-bar", {
    isComponent: (el) => el?.getAttribute?.("data-component") === "announcement-bar",
    model: {
      defaults: {
        droppable: true,
        traits: [
          { type: "checkbox", name: "data-dismissible", label: "Peut etre ferme" },
          { type: "text", name: "data-id", label: "ID unique", placeholder: "promo-1" },
        ],
      },
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add boutique/src/admin/lib/grapes/blocks/interactive.ts
git commit -m "feat(cms): add interactive blocks (accordion, tabs, stats, carousel, announcement)"
```

---

### Task 11: Update block index and sidebar

**Files:**
- Modify: `boutique/src/admin/lib/grapes/blocks/index.ts`
- Modify: `boutique/src/admin/lib/grapes/editor/EditorSidebar.tsx`

- [ ] **Step 1: Update blocks/index.ts**

Read the current `index.ts`, then add imports and calls for the 3 new register functions:

```typescript
import { registerNavigationBlocks } from "./navigation"
import { registerMediaBlocks } from "./media"
import { registerInteractiveBlocks } from "./interactive"
```

Add in `registerAllBlocks()`:
```typescript
registerNavigationBlocks(editor)
registerMediaBlocks(editor)
registerInteractiveBlocks(editor)
```

- [ ] **Step 2: Remove "forms" from EditorSidebar.tsx**

In `boutique/src/admin/lib/grapes/editor/EditorSidebar.tsx`, find the CATEGORIES array and remove the "forms" entry entirely. It should look like the category with `id: "forms"` — just delete that entire object from the array.

- [ ] **Step 3: Verify admin compiles**

```bash
cd boutique && npx tsc --noEmit src/admin/lib/grapes/blocks/index.ts 2>&1 | grep -v node_modules | head -20
```

- [ ] **Step 4: Commit**

```bash
git add boutique/src/admin/lib/grapes/blocks/index.ts boutique/src/admin/lib/grapes/editor/EditorSidebar.tsx
git commit -m "feat(cms): register all new blocks, remove empty Forms category"
```

---

## Chunk 3: Storefront Hydrated Components

This chunk implements the React components that replace GrapeJS HTML on the storefront.

### Task 12: Create site-header hydrated component

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/site-header.tsx`

- [ ] **Step 1: Create client component**

This component replaces the GrapeJS header HTML with a real React header. It receives server-fetched data (categories, store info, theme) as props and uses client-side hooks for cart/auth.

Read the existing `Nav` component at `boutique-storefront/src/modules/layout/templates/nav/index.tsx` for reference on what sub-components exist (CartButton, SideMenu, LocalizedClientLink, etc.) and reuse them.

The component should:
- Accept props: `data-variant`, `categories`, `regions`, `storeInfo`, `themeSettings`
- Render based on variant (simple/ecommerce/minimal)
- Import and use existing sub-components: `CartButton`, `SideMenu`, `LocalizedClientLink`
- Be a `"use client"` component

- [ ] **Step 2: Add serverDataFn in register-components.ts**

Add `fetchHeaderData` that fetches categories, regions, theme settings (reuse `getThemeSettings`, `listCategories` from existing data layer).

Register in `registerAllComponents()`:
```typescript
registerComponent("site-header", {
  component: SiteHeader,
  serverDataFn: fetchHeaderData,
})
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/site-header.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): add hydrated site-header component"
```

---

### Task 13: Create site-footer hydrated component

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/site-footer.tsx`

- [ ] **Step 1: Create client component**

Same pattern as header. Read existing `Footer` at `boutique-storefront/src/modules/layout/templates/footer/index.tsx` for reference.

The component should:
- Accept props: `data-variant`, `categories`, `collections`, `themeSettings`
- Render "full" (4 columns) or "minimal" (single row) variant
- Reuse existing sub-components and data structures

- [ ] **Step 2: Add serverDataFn in register-components.ts**

Add `fetchFooterData` that fetches categories, collections, theme settings.

Register: `registerComponent("site-footer", { component: SiteFooter, serverDataFn: fetchFooterData })`

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/site-footer.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): add hydrated site-footer component"
```

---

### Task 14: Create video-embed component

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/video-embed.tsx`

- [ ] **Step 1: Create client component**

```typescript
"use client"

import { useState } from "react"

function getEmbedUrl(url: string): string | null {
  if (!url) return null

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return null
}

function getThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`
  return null
}

export default function VideoEmbed(props: Record<string, string>) {
  const url = props["data-url"] || ""
  const autoplay = props["data-autoplay"] === "true"
  const [playing, setPlaying] = useState(autoplay)

  const embedUrl = getEmbedUrl(url)
  const thumbnail = getThumbnail(url)

  if (!embedUrl) {
    return (
      <div style={{ position: "relative", paddingTop: "56.25%", background: "#0f172a", borderRadius: 8 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
          Video non configuree
        </div>
      </div>
    )
  }

  if (!playing && thumbnail) {
    return (
      <div
        onClick={() => setPlaying(true)}
        style={{ position: "relative", paddingTop: "56.25%", borderRadius: 8, overflow: "hidden", cursor: "pointer" }}
      >
        <img src={thumbnail} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="white"><polygon points="10,8 16,12 10,16" /></svg>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 8, overflow: "hidden" }}>
      <iframe
        src={`${embedUrl}${autoplay ? "?autoplay=1" : ""}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
```

- [ ] **Step 2: Register in register-components.ts**

```typescript
registerComponent("video-embed", { component: VideoEmbed })
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/video-embed.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): add video-embed hydrated component"
```

---

### Task 15: Create tabs component

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/tabs.tsx`

- [ ] **Step 1: Create client component**

```typescript
"use client"

import { useState, useEffect, useRef } from "react"

export default function Tabs(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const buttons = containerRef.current.querySelectorAll<HTMLElement>("[data-tab]")
    const panels = containerRef.current.querySelectorAll<HTMLElement>("[data-tab-panel]")

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-tab") || "0", 10)
        setActiveTab(idx)
      })
    })

    // Show/hide panels based on activeTab
    panels.forEach((panel) => {
      const idx = parseInt(panel.getAttribute("data-tab-panel") || "0", 10)
      panel.style.display = idx === activeTab ? "block" : "none"
    })

    // Style active button
    buttons.forEach((btn) => {
      const idx = parseInt(btn.getAttribute("data-tab") || "0", 10)
      btn.style.color = idx === activeTab ? "#111827" : "#6b7280"
      btn.style.borderBottom = idx === activeTab ? "2px solid #111827" : "none"
      btn.style.marginBottom = idx === activeTab ? "-2px" : "0"
    })
  }, [activeTab])

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: innerHTML }} />
  )
}
```

- [ ] **Step 2: Register**

```typescript
registerComponent("tabs", { component: Tabs })
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/tabs.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): add tabs hydrated component"
```

---

### Task 16: Create stats-counter component

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/stats-counter.tsx`

- [ ] **Step 1: Create client component**

```typescript
"use client"

import { useEffect, useRef, useState } from "react"

export default function StatsCounter(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true)
          animateCounters()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [hasAnimated])

  function animateCounters() {
    if (!containerRef.current) return
    const numbers = containerRef.current.querySelectorAll<HTMLElement>("[data-target]")

    numbers.forEach((el) => {
      const target = parseInt(el.getAttribute("data-target") || "0", 10)
      const duration = 2000
      const start = performance.now()

      function tick(now: number) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        el.textContent = Math.round(target * eased).toLocaleString("fr-FR")
        if (progress < 1) requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    })
  }

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: innerHTML }} />
  )
}
```

- [ ] **Step 2: Register**

```typescript
registerComponent("stats-counter", { component: StatsCounter })
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/stats-counter.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): add stats-counter hydrated component"
```

---

### Task 17: Create testimonials-carousel component

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/testimonials-carousel.tsx`

- [ ] **Step 1: Create client component**

```typescript
"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export default function TestimonialsCarousel(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const autoplay = props["data-autoplay"] === "true"
  const interval = parseInt(props["data-interval"] || "5000", 10)

  const containerRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const [slideCount, setSlideCount] = useState(0)

  const goTo = useCallback(
    (index: number) => {
      if (!containerRef.current) return
      const slides = containerRef.current.querySelectorAll<HTMLElement>(".testimonial-slide")
      const dots = containerRef.current.querySelectorAll<HTMLElement>("[data-dot]")

      slides.forEach((s, i) => (s.style.display = i === index ? "block" : "none"))
      dots.forEach((d, i) => {
        d.style.background = i === index ? "#111827" : "#d1d5db"
      })

      setCurrent(index)
    },
    []
  )

  useEffect(() => {
    if (!containerRef.current) return
    const slides = containerRef.current.querySelectorAll(".testimonial-slide")
    setSlideCount(slides.length)

    // Add data-dot to dots for identification
    const existingDots = containerRef.current.querySelectorAll<HTMLElement>("span[style*='border-radius']")
    existingDots.forEach((dot, i) => {
      dot.setAttribute("data-dot", String(i))
      dot.style.cursor = "pointer"
      dot.addEventListener("click", () => goTo(i))
    })

    goTo(0)
  }, [innerHTML, goTo])

  useEffect(() => {
    if (!autoplay || slideCount < 2) return

    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % slideCount
        goTo(next)
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [autoplay, interval, slideCount, goTo])

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: innerHTML }} />
  )
}
```

- [ ] **Step 2: Register**

```typescript
registerComponent("testimonials-carousel", { component: TestimonialsCarousel })
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/testimonials-carousel.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): add testimonials-carousel hydrated component"
```

---

### Task 18: Create announcement-bar component

**Files:**
- Create: `boutique-storefront/src/lib/cms/components/announcement-bar.tsx`

- [ ] **Step 1: Create client component**

```typescript
"use client"

import { useState, useEffect } from "react"

export default function AnnouncementBar(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const dismissible = props["data-dismissible"] === "true"
  const bannerId = props["data-id"] || "default"
  const storageKey = `cms-announcement-${bannerId}`

  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissible && typeof window !== "undefined") {
      setDismissed(localStorage.getItem(storageKey) === "dismissed")
    }
  }, [dismissible, storageKey])

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "dismissed")
    setDismissed(true)
  }

  return (
    <div style={{ position: "relative" }}>
      <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
      {dismissible && (
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            opacity: 0.7,
          }}
          aria-label="Fermer"
        >
          &times;
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Register**

```typescript
registerComponent("announcement-bar", { component: AnnouncementBar })
```

- [ ] **Step 3: Commit**

```bash
git add boutique-storefront/src/lib/cms/components/announcement-bar.tsx boutique-storefront/src/lib/cms/register-components.ts
git commit -m "feat(cms): add announcement-bar hydrated component"
```

---

### Task 19: Final verification

- [ ] **Step 1: Build storefront**

```bash
cd boutique-storefront && npm run build 2>&1 | tail -30
```

- [ ] **Step 2: Build admin**

```bash
cd boutique && npm run build 2>&1 | tail -30
```

- [ ] **Step 3: Manual smoke test**

1. Start both servers
2. Open admin → CMS Pages → create or edit a page
3. Verify all block categories appear in sidebar: Sections, Navigation, Basic, Media, Interactive, E-commerce
4. Verify "Forms" is gone
5. Drag a "Header E-commerce" into a layout template
6. Drag a "Footer Complet" into the same layout
7. Assign the layout to a page
8. View the page on storefront → verify header/footer render with real Medusa data
9. Test interactive blocks: add stats-counter, carousel, announcement-bar to a page and verify they work on storefront

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(cms): complete blocks library and hydration pipeline

- 14 new GrapeJS blocks (navigation, media, interactive)
- Generic component hydration pipeline with node-html-parser
- Hydrated React components for header, footer, video, tabs, stats, carousel, announcement
- Fixed homepage import bug
- Fixed CSS double-injection
- Removed empty Forms sidebar category"
```
