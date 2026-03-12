# CMS Blocks Library & Hydration Pipeline

## Context

The GrapeJS page builder has a working drag-and-drop editor with basic blocks (hero, CTA, features, FAQ, cards, products-grid) and a layout/template system. However, several categories in the sidebar are empty (Navigation, Media, Interactive), there are no header/footer blocks, and the storefront rendering pipeline uses ad-hoc regex parsing for dynamic components.

## Goals

1. Create header/footer/nav blocks for full visual control via GrapeJS templates
2. Fill Media and Interactive categories with useful blocks
3. Build a generic component hydration pipeline on the storefront (replacing ad-hoc regex)
4. Fix existing incoherences (import bug, CSS double-inject, empty categories)

## Non-Goals

- Forms (contact, newsletter, custom) — deferred
- Search functionality in header — uses existing Medusa search if available
- Multi-level mega menus — keep navigation simple

## Key Decisions

1. **HTML parsing:** Use `node-html-parser` (lightweight, zero-dep, works server-side) instead of regex. Regex fails on nested elements with the same tag name.
2. **Block CSS:** All blocks use **inline styles** (like existing blocks in `sections.ts`/`basic.ts`), not CSS classes. GrapeJS stores styles in its style manager. No external stylesheet needed.
3. **Header/footer hydration boundary:** `site-header.tsx` and `site-footer.tsx` are **client components** (`"use client"`). Server data (categories, collections, store info) is fetched by `serverDataFn` in the registry and passed as serializable props. Client-side state (cart count, auth status) uses existing Medusa React hooks inside the client component.
4. **data-slot replacement:** The `data-slot` attributes in header HTML are **not parsed by the hydration pipeline**. The hydrated `SiteHeader` component ignores the GrapeJS HTML entirely and renders its own React tree based on `data-variant`. The GrapeJS HTML is just a visual placeholder for the editor.
5. **GrapeJS editability of nav blocks:** Users can edit text content (logo text, link labels, CTA text) in GrapeJS as visual placeholders. But the storefront replaces the entire block with a React component. The GrapeJS content serves as a WYSIWYG preview, not the final render. This is the same pattern as `products-grid`.

---

## 1. Block Inventory

### Navigation (5 blocks) — file: `blocks/navigation.ts`

All navigation blocks output `data-component="site-header"` or `data-component="site-footer"` for storefront hydration.

#### Headers

**header-simple** — Logo + horizontal nav links + CTA button
```html
<header data-component="site-header" data-variant="simple">
  <div class="site-header-inner">
    <a href="/" class="site-logo">Logo</a>
    <nav class="site-nav">
      <a href="#">Boutique</a>
      <a href="#">A propos</a>
      <a href="#">Contact</a>
    </nav>
    <a href="#" class="site-cta-btn">Acheter</a>
  </div>
</header>
```
Traits: `data-variant` (locked to "simple")

**header-ecommerce** — Logo + search + nav + cart/account icons
```html
<header data-component="site-header" data-variant="ecommerce">
  <div class="site-header-inner">
    <a href="/" class="site-logo">Logo</a>
    <nav class="site-nav">
      <a href="#">Boutique</a>
      <a href="#">Collections</a>
    </nav>
    <div class="site-header-actions">
      <span data-slot="search">Recherche</span>
      <span data-slot="account">Compte</span>
      <span data-slot="cart">Panier</span>
    </div>
  </div>
</header>
```
Traits: `data-variant` (locked to "ecommerce")

**header-minimal** — Centered logo + burger menu icon
```html
<header data-component="site-header" data-variant="minimal">
  <div class="site-header-inner">
    <span data-slot="menu-toggle">Menu</span>
    <a href="/" class="site-logo">Logo</a>
    <span data-slot="cart">Panier</span>
  </div>
</header>
```
Traits: `data-variant` (locked to "minimal")

#### Footers

**footer-full** — 4 columns + bottom bar
```html
<footer data-component="site-footer" data-variant="full">
  <div class="site-footer-grid">
    <div class="footer-col">
      <span class="footer-logo">Logo</span>
      <p>Description de votre boutique.</p>
    </div>
    <div class="footer-col">
      <h4>Boutique</h4>
      <a href="#">Nouveautes</a>
      <a href="#">Collections</a>
      <a href="#">Promotions</a>
    </div>
    <div class="footer-col">
      <h4>Informations</h4>
      <a href="#">A propos</a>
      <a href="#">Livraison</a>
      <a href="#">CGV</a>
    </div>
    <div class="footer-col">
      <h4>Suivez-nous</h4>
      <div class="footer-socials">
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
        <a href="#">TikTok</a>
      </div>
    </div>
  </div>
  <div class="footer-bar">
    <p>&copy; 2026 Votre Boutique. Tous droits reserves.</p>
  </div>
</footer>
```

**footer-minimal** — Single row: logo + links + copyright
```html
<footer data-component="site-footer" data-variant="minimal">
  <div class="site-footer-minimal">
    <span class="footer-logo">Logo</span>
    <nav class="footer-links">
      <a href="#">CGV</a>
      <a href="#">Confidentialite</a>
      <a href="#">Contact</a>
    </nav>
    <p class="footer-copy">&copy; 2026</p>
  </div>
</footer>
```

### Media (4 blocks) — file: `blocks/media.ts`

**image-block** — Moved from basic.ts. HTML static, no hydration needed.

**video-embed** — YouTube/Vimeo embed with facade for performance
```html
<div data-component="video-embed" data-url="" data-autoplay="false">
  <div class="video-placeholder">
    <span>Collez l'URL de votre video</span>
  </div>
</div>
```
Traits: `data-url` (text, YouTube/Vimeo URL), `data-autoplay` (checkbox)
Hydrated: Yes — lazy loads iframe, shows thumbnail facade until click.

**image-gallery** — Responsive grid of images. HTML static.
```html
<div class="image-gallery" data-columns="3">
  <figure><img src="placeholder" alt=""><figcaption>Image 1</figcaption></figure>
  <figure><img src="placeholder" alt=""><figcaption>Image 2</figcaption></figure>
  <figure><img src="placeholder" alt=""><figcaption>Image 3</figcaption></figure>
  <figure><img src="placeholder" alt=""><figcaption>Image 4</figcaption></figure>
</div>
```
Traits: `data-columns` (select: 2/3/4)

**logo-cloud** — Brand logos grid with grayscale effect. HTML static.
```html
<section class="logo-cloud">
  <h3>Ils nous font confiance</h3>
  <div class="logo-cloud-grid">
    <img src="placeholder" alt="Brand 1">
    <img src="placeholder" alt="Brand 2">
    <img src="placeholder" alt="Brand 3">
    <img src="placeholder" alt="Brand 4">
    <img src="placeholder" alt="Brand 5">
    <img src="placeholder" alt="Brand 6">
  </div>
</section>
```

### Interactive (5 blocks) — file: `blocks/interactive.ts`

**accordion** — Native HTML details/summary. No hydration needed.
```html
<div class="accordion">
  <details>
    <summary>Question 1</summary>
    <p>Reponse 1</p>
  </details>
  <details>
    <summary>Question 2</summary>
    <p>Reponse 2</p>
  </details>
  <details>
    <summary>Question 3</summary>
    <p>Reponse 3</p>
  </details>
</div>
```

**tabs** — Tabbed content panels
```html
<div data-component="tabs">
  <div class="tabs-nav">
    <button data-tab="0" class="active">Onglet 1</button>
    <button data-tab="1">Onglet 2</button>
    <button data-tab="2">Onglet 3</button>
  </div>
  <div class="tabs-content">
    <div data-tab-panel="0">Contenu de l'onglet 1</div>
    <div data-tab-panel="1">Contenu de l'onglet 2</div>
    <div data-tab-panel="2">Contenu de l'onglet 3</div>
  </div>
</div>
```
Hydrated: Yes — handles tab switching, preserves content editability in GrapeJS.

**stats-counter** — Animated counters on scroll
```html
<section data-component="stats-counter">
  <div class="stats-grid">
    <div class="stat-item">
      <span class="stat-number" data-target="1500">0</span>
      <span class="stat-label">Clients satisfaits</span>
    </div>
    <div class="stat-item">
      <span class="stat-number" data-target="300">0</span>
      <span class="stat-label">Produits</span>
    </div>
    <div class="stat-item">
      <span class="stat-number" data-target="50">0</span>
      <span class="stat-label">Pays livres</span>
    </div>
  </div>
</section>
```
Hydrated: Yes — IntersectionObserver triggers count-up animation.

**testimonials-carousel** — Auto-play testimonials slider
```html
<section data-component="testimonials-carousel" data-autoplay="true" data-interval="5000">
  <div class="carousel-track">
    <div class="testimonial-slide">
      <blockquote>"Excellent service et produits de qualite."</blockquote>
      <cite>Marie D.</cite>
    </div>
    <div class="testimonial-slide">
      <blockquote>"Livraison rapide, je recommande."</blockquote>
      <cite>Pierre L.</cite>
    </div>
    <div class="testimonial-slide">
      <blockquote>"Le meilleur e-commerce que j'ai teste."</blockquote>
      <cite>Sophie M.</cite>
    </div>
  </div>
</section>
```
Traits: `data-autoplay` (checkbox), `data-interval` (number, ms)
Hydrated: Yes — auto-play, swipe, dot indicators.

**announcement-bar** — Dismissible top banner
```html
<div data-component="announcement-bar" data-dismissible="true" data-id="promo-2026">
  <div class="announcement-inner">
    <p>Livraison offerte des 50EUR d'achat</p>
  </div>
</div>
```
Traits: `data-dismissible` (checkbox), `data-id` (text, unique per banner for localStorage)
Hydrated: Yes — dismiss button, localStorage persistence.

---

## 2. Hydration Pipeline (Storefront)

### Current State (broken)

The storefront has inline regex parsing in both `page.tsx` and the homepage `page.tsx` specifically for `products-grid`. Each dynamic component requires duplicated regex code.

### New Architecture

**File:** `boutique-storefront/src/lib/cms/component-registry.ts`

```typescript
import { StoreRegion } from "@medusajs/types"

// Context passed to server data functions during SSR
type RenderContext = {
  region: StoreRegion
  countryCode: string
}

type ComponentEntry = {
  // React component to render (can be server or client component)
  component: React.ComponentType<any>
  // Optional async function to fetch server-side data (runs during SSR)
  // Returns props that are spread onto the component
  serverDataFn?: (attrs: Record<string, string>, context: RenderContext) => Promise<Record<string, any>>
}

const registry: Record<string, ComponentEntry> = {
  "products-grid": { component: ProductsGridServer, serverDataFn: fetchProductsGridData },
  "site-header":   { component: SiteHeaderHydrated, serverDataFn: fetchHeaderData },
  "site-footer":   { component: SiteFooterHydrated, serverDataFn: fetchFooterData },
  "video-embed":   { component: VideoEmbed },
  "tabs":          { component: TabsHydrated },
  "stats-counter": { component: StatsCounter },
  "testimonials-carousel": { component: TestimonialsCarousel },
  "announcement-bar":      { component: AnnouncementBar },
}
```

**File:** `boutique-storefront/src/lib/cms/hydrate-components.ts`

Uses `node-html-parser` to parse the HTML string. Algorithm:

```typescript
import { parse } from "node-html-parser"

type Segment =
  | { type: "html"; content: string }
  | { type: "component"; name: string; attrs: Record<string, string>; innerHTML: string }

function extractComponents(html: string): Segment[] {
  const root = parse(html)
  const segments: Segment[] = []

  // Find all elements with data-component attribute at any depth
  const componentNodes = root.querySelectorAll("[data-component]")

  if (componentNodes.length === 0) {
    return [{ type: "html", content: html }]
  }

  // For each component node:
  // 1. Replace it in the HTML with a unique marker
  // 2. Record its attributes and innerHTML
  // 3. Split the final HTML by markers and interleave components

  let markerIndex = 0
  const components: Array<{ marker: string; name: string; attrs: Record<string, string>; innerHTML: string }> = []

  for (const node of componentNodes) {
    const marker = `__CMS_COMPONENT_${markerIndex++}__`
    const name = node.getAttribute("data-component")!
    const attrs: Record<string, string> = {}
    for (const [key, value] of Object.entries(node.attributes)) {
      if (key.startsWith("data-")) attrs[key] = value
    }
    components.push({ marker, name, attrs, innerHTML: node.innerHTML })
    node.replaceWith(marker)
  }

  // Get the modified HTML with markers
  const markedHtml = root.toString()

  // Split by markers and build segments
  let remaining = markedHtml
  for (const comp of components) {
    const idx = remaining.indexOf(comp.marker)
    if (idx > 0) {
      segments.push({ type: "html", content: remaining.slice(0, idx) })
    }
    segments.push({ type: "component", name: comp.name, attrs: comp.attrs, innerHTML: comp.innerHTML })
    remaining = remaining.slice(idx + comp.marker.length)
  }
  if (remaining.length > 0) {
    segments.push({ type: "html", content: remaining })
  }

  return segments
}
```

**File:** `boutique-storefront/src/lib/cms/cms-page-renderer.tsx`

```typescript
type CmsPageRendererProps = {
  html: string
  css: string
  layout?: { html: string; css: string } | null
  context: RenderContext
  isPreview?: boolean
}
```

Server component that:
1. Merges layout with page content if `layout` is provided (reusing `mergeLayoutWithContent`)
2. Detects if merged HTML contains `data-component="site-header"` or `data-component="site-footer"` → sets `data-cms-full-layout` attribute to hide default Nav/Footer
3. Calls `extractComponents(mergedHtml)` to get segments
4. For each component segment, calls `registry[name].serverDataFn(attrs, context)` if it exists. Wraps in try/catch — on error, falls back to rendering the raw innerHTML as static HTML.
5. Renders array: static HTML via `dangerouslySetInnerHTML`, React components with their fetched props
6. Injects CSS **once** via a single `<style>` tag (layout CSS + page CSS concatenated)

This replaces the duplicated rendering logic in both `[...slug]/page.tsx` and `page.tsx`. The route files keep their own responsibilities (slug parsing, 404 logic, preview detection, homepage fallback to Hero/FeaturedProducts) and delegate rendering to `CmsPageRenderer`.

### Hydrated Components Location

```
boutique-storefront/src/lib/cms/
  component-registry.ts        # Registry mapping
  hydrate-components.ts         # Generic HTML parser
  cms-page-renderer.tsx         # Server component for rendering
  components/
    site-header.tsx             # Reuses existing Nav logic
    site-footer.tsx             # Reuses existing Footer logic
    video-embed.tsx             # Lazy iframe with facade
    tabs.tsx                    # Tab switching
    stats-counter.tsx           # Intersection Observer counter
    testimonials-carousel.tsx   # Swipe + autoplay
    announcement-bar.tsx        # Dismiss + localStorage
```

### Header/Footer Hydration Detail

**Server data functions:**
- `fetchHeaderData(attrs, context)` → fetches categories, regions, theme settings, store info server-side. Returns serializable props.
- `fetchFooterData(attrs, context)` → fetches categories, collections, theme settings. Returns serializable props.

**Client components:**
- `site-header.tsx` (`"use client"`) receives server-fetched props + `data-variant`:
  - For "ecommerce" variant: renders logo, nav links (from server props), cart (client-side `useCart` hook), account link (client-side auth state), search
  - For "simple" variant: renders logo, nav links, CTA button
  - For "minimal" variant: burger menu, centered logo, cart icon
  - The GrapeJS HTML is NOT rendered — the React component replaces it entirely (same as products-grid)

- `site-footer.tsx` (`"use client"`) receives server-fetched props + `data-variant`:
  - For "full" variant: 4-column layout with real categories/collections/social links from props
  - For "minimal" variant: single row with essential links
  - Dynamic copyright year via `new Date().getFullYear()`

**Existing component reuse:** The hydrated header/footer components should import and reuse the internal sub-components from the existing Nav and Footer modules where possible (CartButton, SideMenu, LocalizedLink, etc.) rather than duplicating their logic.

### products-grid migration

The existing `products-grid-server.tsx` moves from `[...slug]/` to `src/lib/cms/components/products-grid-server.tsx`. The existing server-side product fetching logic moves into `fetchProductsGridData` as the `serverDataFn`. The component stays a server component (RSC).

### Detection of Layout Header/Footer

When rendering, the pipeline checks if the merged HTML contains `data-component="site-header"` or `data-component="site-footer"`. If yes, the `data-cms-full-layout` attribute is set to hide the default Nav/Footer. If not (plain layout without navigation blocks), the default Nav/Footer stay visible.

This replaces the current approach of blindly hiding Nav/Footer for any layout.

---

## 3. Bug Fixes & Cleanup

### Fix: Homepage import paths
**File:** `boutique-storefront/src/app/[countryCode]/(main)/page.tsx`

Change:
```typescript
import { GjsRenderer } from "./page/[slug]/gjs-renderer"
import ProductsGridServer from "./page/[slug]/products-grid-server"
```
To: use the new `CmsPageRenderer` component (imports are eliminated).

### Fix: CSS double injection
**File:** `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx`

Currently both the page wrapper AND GjsRenderer inject CSS. The new `CmsPageRenderer` handles CSS injection once.

### Fix: Remove empty sidebar categories
**File:** `boutique/src/admin/lib/grapes/editor/EditorSidebar.tsx`

Remove "Forms" from the categories list. Keep only categories that have blocks: Sections, Navigation, Collections (E-commerce), Basic, Media, Interactive.

### Fix: Move blocks between categories
- `image-block` moves from Basic → Media
- `faq` block stays in Sections (it's a full section), add `accordion` to Interactive (standalone component)

### Fix: Sidebar category-to-GrapeJS mapping
Update the `categoryToGjs` mapping in EditorSidebar to correctly map:
- "Navigation" → "Navigation"
- "Media" → "Media"
- "Interactive" → "Interactive"

---

## 4. GrapeJS Block Registration

### New block files

```
boutique/src/admin/lib/grapes/blocks/
  index.ts          # Updated: registers all block files
  basic.ts          # Updated: image-block removed (moved to media)
  sections.ts       # Unchanged
  ecommerce.ts      # Unchanged
  navigation.ts     # NEW: 3 headers + 2 footers
  media.ts          # NEW: image (moved), video-embed, gallery, logo-cloud
  interactive.ts    # NEW: accordion, tabs, stats-counter, carousel, announcement-bar
```

### Custom component types needed

Each hydrated block needs a GrapeJS component type registered (like products-grid has) so traits are configurable in the editor:

- `site-header`: trait for `data-variant` (readonly display)
- `site-footer`: trait for `data-variant` (readonly display)
- `video-embed`: traits for `data-url`, `data-autoplay`
- `tabs`: no special traits (content-editable)
- `stats-counter`: traits on `.stat-number` children for `data-target`
- `testimonials-carousel`: traits for `data-autoplay`, `data-interval`
- `announcement-bar`: traits for `data-dismissible`, `data-id`

---

## 5. File Changes Summary

### New files (admin — blocks)
- `boutique/src/admin/lib/grapes/blocks/navigation.ts`
- `boutique/src/admin/lib/grapes/blocks/media.ts`
- `boutique/src/admin/lib/grapes/blocks/interactive.ts`

### New dependency (storefront)
- `node-html-parser` — lightweight HTML parser for component extraction (add to `boutique-storefront/package.json`)

### New files (storefront — hydration)
- `boutique-storefront/src/lib/cms/component-registry.ts`
- `boutique-storefront/src/lib/cms/hydrate-components.ts`
- `boutique-storefront/src/lib/cms/cms-page-renderer.tsx`
- `boutique-storefront/src/lib/cms/components/site-header.tsx`
- `boutique-storefront/src/lib/cms/components/site-footer.tsx`
- `boutique-storefront/src/lib/cms/components/products-grid-server.tsx` (moved from `[...slug]/`)
- `boutique-storefront/src/lib/cms/components/video-embed.tsx`
- `boutique-storefront/src/lib/cms/components/tabs.tsx`
- `boutique-storefront/src/lib/cms/components/stats-counter.tsx`
- `boutique-storefront/src/lib/cms/components/testimonials-carousel.tsx`
- `boutique-storefront/src/lib/cms/components/announcement-bar.tsx`

### Modified files
- `boutique/src/admin/lib/grapes/blocks/index.ts` — register new block files
- `boutique/src/admin/lib/grapes/blocks/basic.ts` — remove image-block
- `boutique/src/admin/lib/grapes/editor/EditorSidebar.tsx` — remove Forms category, fix mappings
- `boutique-storefront/src/app/[countryCode]/(main)/page.tsx` — use CmsPageRenderer, fix imports
- `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx` — use CmsPageRenderer
- `boutique-storefront/src/lib/data/cms-layout-merge.ts` — smart Nav/Footer hiding based on content detection

### Files to remove
- `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/gjs-renderer.tsx` — replaced by CmsPageRenderer
- `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/products-grid-server.tsx` — moved to `src/lib/cms/components/`
