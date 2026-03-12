# CMS Architecture Cleanup & Hardening

## Context

The GrapesJS + Medusa v2 + Next.js 15 CMS system is functional but has accumulated technical debt:
- GrapesJS blocks use raw HTML strings instead of proper component types
- No HTML sanitization on the storefront (`dangerouslySetInnerHTML` without DOMPurify)
- No CSS scoping — GrapesJS CSS injected globally, collision risk with Tailwind
- TypeScript errors silenced (`ignoreBuildErrors: true`)
- Dead code from legacy Puck CMS still present
- No SSG (`generateStaticParams`), no JSON-LD, no sitemap
- No Zod validation on API routes

## Goals

1. Refactor all GrapesJS blocks into proper component types (`addType` with `isComponent`, traits, lifecycle hooks)
2. Add HTML sanitization, GrapesJS artifact stripping, and CSS scoping to the storefront pipeline
3. Enable full TypeScript strict mode across both projects
4. Remove all dead code (Puck legacy, unused dependencies, stale redirects)
5. Add SEO infrastructure (generateStaticParams, JSON-LD, sitemap, robots)
6. Add Zod validation to Medusa API routes

## Non-Goals

- Tests (deferred to a subsequent phase)
- New blocks or components — this is cleanup and hardening only
- Changes to Medusa data models, workflows, or module structure
- Changes to GrapesJS plugins (content-slot, block-lock, context-menu, template-sync)
- Changes to hydrated storefront components (site-header.tsx, tabs.tsx, etc.)
- Removing the Figma import feature

## Key Decisions

1. **Component type naming**: Static blocks (no storefront hydration) are prefixed `cms-` (e.g., `cms-hero`, `cms-heading`). Hydrated blocks keep their current unprefixed names (`products-grid`, `site-header`, `tabs`, etc.) because the name is the contract with the storefront pipeline via `data-component`.

2. **Detection strategy**: Static types use CSS class detection (`.cms-hero`). Hydrated types use `data-component` attribute detection. Both coexist intentionally.

3. **File separation**: Component types go in `types/` directory, blocks go in `blocks/` directory. Types define behavior (isComponent, model, traits, lifecycle), blocks only reference a type and provide a sidebar preview.

4. **CSS scoping**: Prefix all GrapesJS CSS selectors with `[data-cms-page="<slug>"]` via a post-processing function. No Shadow DOM (SSR-incompatible). No CSS Modules (incompatible with raw HTML injection).

5. **Sanitization**: Storefront-only via `isomorphic-dompurify`. Not at API write time (would break GrapesJS editor reload). Not at API read time (keeps API as pure data layer).

6. **TypeScript**: Full `strict: true` on both projects. Upstream Medusa starter code (account, cart, checkout modules) gets `// @ts-expect-error` with `TODO` comments for non-blocking errors.

7. **Backward compatibility**: Existing pages in database are not affected. Component types use `isComponent` to detect existing HTML. The storefront consumes `gjsHtml` which remains standard HTML.

---

## 1. Architecture Target

```
ADMIN (boutique/)
  GrapesJS Editor
  ├── types/           ← Component Types (addType with isComponent, traits, lifecycle)
  │   ├── static.ts       10 types: cms-heading, cms-rich-text, cms-spacer, cms-divider,
  │   │                             cms-hero, cms-cta, cms-features, cms-faq,
  │   │                             cms-image-text, cms-card-grid
  │   ├── media.ts         4 types: cms-image, video-embed(*), cms-image-gallery, cms-logo-cloud
  │   ├── navigation.ts    2 types: site-header(*), site-footer(*)
  │   ├── interactive.ts   5 types: cms-accordion, tabs(*), stats-counter(*),
  │   │                             testimonials-carousel(*), announcement-bar(*)
  │   ├── ecommerce.ts     1 type:  products-grid(*)
  │   └── index.ts         registerAllTypes(editor)
  │
  ├── blocks/          ← Blocks (reference types, provide sidebar preview)
  │   ├── basic.ts         content: { type: 'cms-heading' } etc.
  │   ├── sections.ts      content: { type: 'cms-hero' } etc.
  │   ├── navigation.ts    content: { type: 'site-header', ... } etc.
  │   ├── media.ts         content: { type: 'cms-image' } etc.
  │   ├── interactive.ts   content: { type: 'tabs' } etc.
  │   ├── ecommerce.ts     content: { type: 'products-grid', ... }
  │   └── index.ts         registerAllBlocks(editor)
  │
  ├── plugins/         ← UNCHANGED
  ├── editor/          ← GrapesEditor.tsx: init order = types → blocks → plugins
  └── theme.ts         ← UNCHANGED

  (*) = hydrated on storefront via data-component

API MEDUSA (contract between admin & storefront)
  cms_page.content = { gjsHtml, gjsCss, gjsComponents, gjsStyles }
  Routes: Zod validation via defineMiddlewares

STOREFRONT (boutique-storefront/)
  Pipeline:
  1. sanitizeCmsHtml(html)       → DOMPurify whitelist
  2. stripGjsArtifacts(html)     → remove data-gjs-*, gjs-* classes
  3. scopeCmsCss(css, slug)      → prefix with [data-cms-page="slug"]
  4. extractComponents(html)     → static HTML + component segments
  5. resolveServerData(segments)  → serverDataFn per component
  6. render()                    → React Server Components

  SEO:
  ├── generateStaticParams()     → ISR with 60s revalidate
  ├── generateMetadata()         → JSON-LD WebPage schema
  ├── sitemap.ts                 → dynamic from published slugs
  └── robots.ts                  → allow all + sitemap reference
```

---

## 2. Phase 0 — Cleanup & Hardening (prerequisite)

### 2.1 Dead Code Removal

| Target | File | Action |
|--------|------|--------|
| Puck legacy fallback | `boutique-storefront/src/app/[countryCode]/(main)/page.tsx` lines 73-78 | Remove the `// Legacy Puck format` block |
| Puck legacy fallback | `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx` lines 89-96 | Remove the legacy format block |
| Stale redirect | `boutique-storefront/next.config.js` | Remove `/:countryCode/page/:slug*` redirect |

Note: `csv-stringify` in `boutique/package.json` is actively used by `src/modules/product-import/utils/csv.ts` — do NOT remove.

### 2.2 TypeScript Strict

**Backend (`boutique/tsconfig.json`):**
- Add `"strict": true` (currently only `strictNullChecks` is active)
- Fix resulting errors in CMS module, API routes, GrapesJS plugins, admin components

**Storefront (`boutique-storefront/next.config.js`):**
- Set `typescript.ignoreBuildErrors` to `false`
- Set `eslint.ignoreDuringBuilds` to `false`
- `tsconfig.json` already has `strict: true` — this exposes previously silenced errors
- Fix all TS and ESLint errors
- For upstream Medusa starter modules (account, cart, checkout): use `// @ts-expect-error // TODO: fix upstream type` for non-blocking errors

### 2.3 Naming Conventions

- Static component types: `cms-` prefix (e.g., `cms-hero`, `cms-heading`)
- Hydrated component types: no prefix (e.g., `products-grid`, `tabs`) — name = `data-component` value
- Block IDs: kebab-case matching the type name without prefix (e.g., block `hero` → type `cms-hero`)
- File structure: `types/` for component types, `blocks/` for block definitions

---

## 3. Track A — GrapesJS Component Types (Admin)

### 3.1 Component Type Pattern

Each block becomes a proper component type following GrapesJS norms:

```typescript
// types/static.ts — pattern for all static types
editor.Components.addType('cms-hero', {
  isComponent: (el) => el.tagName === 'SECTION' && el.classList?.contains('cms-hero'),

  model: {
    defaults: {
      tagName: 'section',
      classes: ['cms-hero'],
      name: 'Hero',
      droppable: true,
      traits: [
        { type: 'text', name: 'heading', label: 'Titre', changeProp: true },
        { type: 'text', name: 'subheading', label: 'Sous-titre', changeProp: true },
        { type: 'text', name: 'cta-text', label: 'Texte du bouton', changeProp: true },
        { type: 'text', name: 'cta-url', label: 'Lien du bouton', changeProp: true },
      ],
      components: [
        { tagName: 'div', classes: ['hero-overlay'] },
        {
          tagName: 'div', classes: ['hero-content'],
          components: [
            { tagName: 'h1', content: 'Welcome to Our Store', classes: ['hero-title'] },
            { tagName: 'p', content: 'Discover our latest collection', classes: ['hero-subtitle'] },
            { tagName: 'a', content: 'Shop Now', classes: ['hero-cta'], attributes: { href: '/store' } },
          ]
        }
      ],
      styles: `
        .cms-hero { position:relative; width:100%; min-height:500px; display:flex; background:#1f2937; }
        .cms-hero .hero-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.4); }
        .cms-hero .hero-content { /* ... */ }
        .cms-hero .hero-title { font-size:48px; font-weight:700; color:#fff; }
        .cms-hero .hero-subtitle { margin-top:20px; font-size:18px; color:#fff; opacity:0.9; }
        .cms-hero .hero-cta { /* ... */ }
      `,
    },

    init() {
      this.on('change:heading', this.updateHeading);
      this.on('change:subheading', this.updateSubheading);
    },

    updateHeading() {
      const h1 = this.find('.hero-title')[0];
      if (h1) h1.set('content', this.get('heading'));
    },

    updateSubheading() {
      const p = this.find('.hero-subtitle')[0];
      if (p) p.set('content', this.get('subheading'));
    },
  },
});
```

Blocks then reference the type:

```typescript
// blocks/sections.ts
bm.add('hero', {
  label: 'Hero',
  category: 'Sections',
  content: { type: 'cms-hero' },
  media: '<svg .../>',
});
```

### 3.2 Full Component Type Inventory

**Static types — `types/static.ts` (10 types):**

| Type ID | isComponent | tagName | Key Traits | Lifecycle |
|---------|-------------|---------|------------|-----------|
| `cms-heading` | `.cms-heading` | `div` | `text`, `level` (h1-h6 select) | `change:level` → change inner heading tagName |
| `cms-rich-text` | `.cms-rich-text` | `div` | (inline editable content) | — |
| `cms-spacer` | `.cms-spacer` | `div` | `height` (number, px) | `change:height` → update style |
| `cms-divider` | `.cms-divider` | `div` | `color` (color), `width` (%) | `change:color` → update border |
| `cms-hero` | `.cms-hero` | `section` | `heading`, `subheading`, `cta-text`, `cta-url` | sync content |
| `cms-cta` | `.cms-cta` | `section` | `heading`, `description`, `primary-text`, `secondary-text` | sync content |
| `cms-features` | `.cms-features` | `section` | `columns` (2/3/4 select) | `change:columns` → update grid |
| `cms-faq` | `.cms-faq` | `section` | — (native details/summary) | — |
| `cms-image-text` | `.cms-image-text` | `section` | `image-position` (left/right) | `change:image-position` → swap grid order |
| `cms-card-grid` | `.cms-card-grid` | `section` | `columns` (2/3/4 select) | `change:columns` → update grid |

**Media types — `types/media.ts` (4 types):**

| Type ID | isComponent | Key Traits |
|---------|-------------|------------|
| `cms-image` | `.cms-image` | (native GrapesJS image trait). Note: block ID renamed from `image-block` to `image` to match convention |
| `video-embed` | `[data-component="video-embed"]` | `data-url`, `data-autoplay` |
| `cms-image-gallery` | `.cms-image-gallery` | `columns` (2/3/4) |
| `cms-logo-cloud` | `.cms-logo-cloud` | — |

**Navigation types — `types/navigation.ts` (2 types, existing, enriched):**

| Type ID | isComponent | Enrichments |
|---------|-------------|-------------|
| `site-header` | `[data-component="site-header"]` | Add `name: 'Header'` |
| `site-footer` | `[data-component="site-footer"]` | Add `name: 'Footer'` |

**Interactive types — `types/interactive.ts` (5 types):**

| Type ID | isComponent | Enrichments |
|---------|-------------|-------------|
| `cms-accordion` | `.cms-accordion` | New type (currently no type) |
| `tabs` | `[data-component="tabs"]` | Add `name: 'Tabs'` |
| `stats-counter` | `[data-component="stats-counter"]` | Add `name: 'Stats Counter'` |
| `testimonials-carousel` | `[data-component="testimonials-carousel"]` | Add `name: 'Testimonials'` |
| `announcement-bar` | `[data-component="announcement-bar"]` | Add `name: 'Announcement Bar'` |

**E-commerce types — `types/ecommerce.ts` (1 type, moved):**

| Type ID | isComponent | Enrichments |
|---------|-------------|-------------|
| `products-grid` | `[data-component="products-grid"]` | Move from blocks/, add `name: 'Products Grid'` |

### 3.3 Semantic Tag Changer Adjustment

The `registerSemanticTagChanger` in `blocks/index.ts` overrides the `default` type to add a `tagName` trait on all components. Component types that define a fixed `tagName` (e.g., `cms-hero` → `section`, `site-header` → `header`) should not expose this trait. The semantic tag changer remains as-is — custom types override the default traits with their own trait list, so no conflict occurs.

### 3.4 Editor Initialization Order

In `GrapesEditor.tsx`, the `handleEditor` callback changes to:

```
1. injectFramerTheme()
2. registerAllTypes(editor)     ← NEW (types must exist before blocks)
3. registerAllBlocks(editor)    ← existing (blocks reference types)
4. contentSlotPlugin(editor)    ← existing
5. guardContentPlaceholderDuplicates(editor)
6. blockLockPlugin(editor)
7. contextMenuPlugin(editor)
8. templateSyncPlugin(editor)
9. onEditor(editor)
```

### 3.5 Files Changed — Track A

| Action | File |
|--------|------|
| Create | `boutique/src/admin/lib/grapes/types/static.ts` |
| Create | `boutique/src/admin/lib/grapes/types/media.ts` |
| Create | `boutique/src/admin/lib/grapes/types/navigation.ts` |
| Create | `boutique/src/admin/lib/grapes/types/interactive.ts` |
| Create | `boutique/src/admin/lib/grapes/types/ecommerce.ts` |
| Create | `boutique/src/admin/lib/grapes/types/index.ts` |
| Modify | `boutique/src/admin/lib/grapes/blocks/basic.ts` — content → `{ type }` |
| Modify | `boutique/src/admin/lib/grapes/blocks/sections.ts` — content → `{ type }` |
| Modify | `boutique/src/admin/lib/grapes/blocks/navigation.ts` — remove addType calls, content → `{ type }` |
| Modify | `boutique/src/admin/lib/grapes/blocks/media.ts` — remove addType calls, content → `{ type }` |
| Modify | `boutique/src/admin/lib/grapes/blocks/interactive.ts` — remove addType calls, content → `{ type }` |
| Modify | `boutique/src/admin/lib/grapes/blocks/ecommerce.ts` — remove addType call, content → `{ type }` |
| Modify | `boutique/src/admin/lib/grapes/blocks/index.ts` — call registerAllTypes before registerAllBlocks |
| Modify | `boutique/src/admin/lib/grapes/editor/GrapesEditor.tsx` — init order |

---

## 4. Track B — Storefront Pipeline & SEO

### 4.1 Sanitization Pipeline — `lib/cms/sanitize.ts`

Three pure functions chained in CmsPageRenderer:

**`sanitizeCmsHtml(html: string): string`**
- Uses `isomorphic-dompurify`
- Whitelists: `style`, `details`, `summary` tags
- Whitelists: all `data-*` attributes used by the pipeline (data-component, data-variant, data-collection, data-limit, data-columns, data-show-view-all, data-url, data-autoplay, data-interval, data-tab, data-tab-panel, data-target, data-slide, data-dot, data-dismissible, data-id, data-dismiss, data-slot, data-tpl-locked, data-tpl-block-id)
- Forbids: `script`, `iframe`, `object`, `embed`, `form` tags
- Forbids: `onerror`, `onclick`, `onload`, `onmouseover` attributes

**`stripGjsArtifacts(html: string): string`**
- Uses `node-html-parser` (already installed)
- Removes all `data-gjs-*` attributes
- Removes all `gjs-*` CSS classes
- Preserves all other attributes and classes

**`scopeCmsCss(css: string, slug: string): string`**
- Prefixes all CSS selectors with `[data-cms-page="<slug>"]`
- Skips `@media`, `@supports`, `@keyframes` and other at-rules (including selectors inside `@keyframes` blocks like `from`, `to`, `0%`, `100%` which must NOT be prefixed)
- Skips `body` and `html` selectors
- Handles comma-separated selectors

### 4.2 CmsPageRenderer Changes

**New prop:** `slug: string` passed from route pages:
- Homepage (`page.tsx`): passes `slug="/"`
- Catch-all (`[...slug]/page.tsx`): passes `slug={compositeSlug}` (e.g., `"about"` or `"legal/cgv"`)

**Pipeline becomes:**
1. Merge layout with content (existing)
2. `sanitizeCmsHtml(finalHtml)` ← NEW
3. `stripGjsArtifacts(finalHtml)` ← NEW
4. `scopeCmsCss(finalCss, slug)` ← NEW
5. Detect header/footer (existing)
6. Extract components (existing)
7. Resolve server data (existing)
8. Render with wrapper `<div data-cms-page={slug}>` ← CHANGED

**CSS ordering fix:** Move `<style>` tags before content in the render output to prevent FOUC:
```tsx
<div data-cms-page={slug}>
  {finalCss && <style dangerouslySetInnerHTML={{ __html: finalCss }} />}
  {hideDefaultNav && <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />}
  {isPreview && <div>PREVIEW MODE</div>}
  {resolvedSegments.map(/* ... */)}
</div>
```

### 4.3 SEO Infrastructure

**`generateStaticParams` in `[...slug]/page.tsx`:**
- Calls `getAllPublishedCmsSlugs()` to fetch all published slugs
- Returns slugs split into arrays for the catch-all route
- Adds `export const revalidate = 60` for ISR

**JSON-LD in `generateMetadata`:**
- Both homepage and `[...slug]` routes add WebPage schema
- Uses `@context: https://schema.org`, `@type: WebPage`
- Includes `name`, `description`, `url`

**New `app/sitemap.ts`:**
- Fetches all published CMS slugs
- Returns MetadataRoute.Sitemap array with priorities

**New `app/robots.ts`:**
- Allow all user agents
- References sitemap URL

### 4.4 New API Route

**`boutique/src/api/store/cms-pages/slugs/route.ts`:**
- `GET /store/cms-pages/slugs`
- Returns `{ slugs: string[] }` — all published page slugs
- Handles parent/child slug composition
- Filters out the root slug `/`

### 4.5 Zod Validation

**`boutique/src/api/middlewares.ts`:**
- Zod schema for `POST /admin/cms-pages/:id` — validates title, slug format, content structure, SEO fields
- Uses Medusa's `validateAndTransformBody` middleware

### 4.6 New Dependency

- `isomorphic-dompurify` added to `boutique-storefront/package.json`

### 4.7 Files Changed — Track B

| Action | File |
|--------|------|
| Create | `boutique-storefront/src/lib/cms/sanitize.ts` |
| Create | `boutique-storefront/src/app/sitemap.ts` |
| Create | `boutique-storefront/src/app/robots.ts` |
| Create | `boutique/src/api/store/cms-pages/slugs/route.ts` |
| Modify | `boutique-storefront/src/lib/cms/cms-page-renderer.tsx` |
| Modify | `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx` |
| Modify | `boutique-storefront/src/app/[countryCode]/(main)/page.tsx` |
| Modify | `boutique-storefront/src/lib/data/cms-pages.ts` |
| Modify | `boutique-storefront/next.config.js` |
| Create/Modify | `boutique/src/api/middlewares.ts` |
| Add dep | `isomorphic-dompurify` in boutique-storefront |

---

## 5. Execution Order & Dependencies

### 5.1 Dependency Graph

```
Phase 0 — Cleanup (prerequisite for all)
  0.1 Remove dead code (Puck, redirect)
  0.2 TS strict backend (tsconfig + fix errors)
  0.3 TS strict storefront (next.config + fix errors)
  0.4 Normalize naming conventions
        │
        ├──────────────────────────┐
        ▼                          ▼
Track A — Admin/GrapesJS        Track B — Storefront/Next.js
(independent, parallelizable)
        │                          │
  A.1-A.5 Create types/*.ts       B.1 Create sanitize.ts
  A.6 Create types/index.ts       B.2 Refactor CmsPageRenderer
  A.7 Refactor blocks/*.ts        B.3 Create route /store/cms-pages/slugs
  A.8 Modify GrapesEditor.tsx     B.4 generateStaticParams + revalidate
  A.9 Adjust registerSemantic     B.5 JSON-LD in generateMetadata
        │                          B.6 sitemap.ts + robots.ts
        │                          B.7 Zod validation on API routes
        │                          B.8 Remove ignoreBuildErrors + fix
        │                          │
        ├──────────────────────────┘
        ▼
Phase F — Cross-validation
  F.1 Verify GrapesJS block → save → storefront render pipeline
  F.2 Verify CSS scoping on 2-3 pages
  F.3 Verify generateStaticParams lists slugs
  F.4 Verify JSON-LD with schema.org validator
  F.5 Full build with no errors (TS strict + ESLint)
```

### 5.2 Ordering Within Tracks

**Phase 0** — Sequential:
1. 0.1 Dead code → reduces noise
2. 0.2 TS strict backend → may reveal API route errors
3. 0.3 TS strict storefront → largest effort in this phase
4. 0.4 Conventions → once code is clean, normalize

**Track A** — Sequential (types must exist before blocks):
1. A.1→A.5 Create 5 type files (parallelizable among themselves)
2. A.6 Create types/index.ts (depends on A.1-A.5)
3. A.7 Refactor 6 blocks/*.ts files (depends on A.6)
4. A.8 Modify GrapesEditor.tsx init order (depends on A.6-A.7)
5. A.9 Adjust registerSemanticTagChanger (depends on A.1)

**Track B** — Partially parallelizable:
1. B.1 sanitize.ts → no dependencies
2. B.2 Refactor CmsPageRenderer → depends on B.1
3. B.3 Route /slugs → no dependencies (backend)
4. B.4 generateStaticParams → depends on B.3
5. B.5 JSON-LD → no dependencies
6. B.6 sitemap + robots → depends on B.3
7. B.7 Zod validation → no dependencies (backend)
8. B.8 Remove ignoreBuildErrors → LAST, after everything compiles

### 5.3 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TS strict reveals 100+ errors in upstream Medusa starter code | High | Fix CMS files + blocking errors only. Use `// @ts-expect-error // TODO: fix upstream type` for non-blocking upstream module errors |
| Switching blocks from raw HTML to `{ type }` breaks existing pages in DB | High | Component types use `isComponent` to detect existing HTML on reload. Storefront consumes `gjsHtml` (standard HTML) — no impact |
| CSS scoping regex breaks complex selectors (media queries, keyframes, pseudo-elements) | Medium | Regex skips at-rules and `@keyframes` blocks entirely (selectors inside keyframes like `from`, `to`, `0%` are not prefixed). Pseudo-elements are prefixed correctly. Test with real CSS from database |
| `isomorphic-dompurify` adds jsdom dependency (~2MB) | Low | Acceptable for security. Alternative: `dompurify` + `linkedom` if bundle size is a concern |
| GrapesJS `styles` property (CssComposer) conflicts with preset-webpage | Medium | Test that default styles inject correctly in canvas and export via `getCss()`. Fall back to inline styles in `components` if conflicts arise |

### 5.4 What Does NOT Change

- GrapesJS plugins (content-slot, block-lock, context-menu, template-sync)
- Data models (cms_page, cms_layout)
- Medusa workflows (create, update, delete, publish, unpublish)
- EditorSidebar.tsx, EditorToolbar.tsx, EditorRightPanel.tsx
- Figma import feature
- Hydrated storefront components (site-header.tsx, tabs.tsx, etc.)
- Component registry + register-components.ts
- Layout merge logic
- CMS module (service, migrations)
- Standard e-commerce pages (products, cart, checkout, account) — except TS fixes if blocking
