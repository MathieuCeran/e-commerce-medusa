# CMS Architecture Cleanup & Hardening — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up dead code, enable TypeScript strict mode, refactor all GrapesJS blocks into proper component types, add HTML sanitization + CSS scoping to the storefront pipeline, and add SEO infrastructure.

**Architecture:** Parallel tracks — Phase 0 (cleanup) is prerequisite, then Track A (admin GrapesJS component types) and Track B (storefront pipeline + SEO) run independently. They share only the data contract (`cms_page.content` JSON format) which does not change.

**Tech Stack:** GrapesJS 0.22.14, Next.js 15.3.9, Medusa v2.13.1, React 19, node-html-parser, isomorphic-dompurify, TypeScript strict

**Spec:** `docs/superpowers/specs/2026-03-12-cms-architecture-cleanup-design.md`

**Note:** Tests are deferred to a subsequent phase. No git commits in this plan per user instruction. Zod validation on API routes is already implemented (`boutique/src/api/admin/cms-pages/middlewares.ts`).

---

## File Map

### Phase 0 — Files to modify

| File | Responsibility |
|------|---------------|
| `boutique-storefront/src/app/[countryCode]/(main)/page.tsx` | Remove Puck legacy fallback |
| `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx` | Remove Puck legacy fallback |
| `boutique-storefront/next.config.js` | Remove stale redirect, disable ignoreBuildErrors |
| `boutique/tsconfig.json` | Enable strict mode |

### Track A — New files

| File | Responsibility |
|------|---------------|
| `boutique/src/admin/lib/grapes/types/static.ts` | 10 static component types (cms-heading, cms-hero, etc.) |
| `boutique/src/admin/lib/grapes/types/media.ts` | 4 media component types (cms-image, video-embed, etc.) |
| `boutique/src/admin/lib/grapes/types/navigation.ts` | 2 navigation component types (site-header, site-footer) |
| `boutique/src/admin/lib/grapes/types/interactive.ts` | 5 interactive component types (cms-accordion, tabs, etc.) |
| `boutique/src/admin/lib/grapes/types/ecommerce.ts` | 1 e-commerce component type (products-grid) |
| `boutique/src/admin/lib/grapes/types/index.ts` | registerAllTypes(editor) aggregator |

### Track A — Files to modify

| File | Change |
|------|--------|
| `boutique/src/admin/lib/grapes/blocks/basic.ts` | content → `{ type: 'cms-xxx' }` |
| `boutique/src/admin/lib/grapes/blocks/sections.ts` | content → `{ type: 'cms-xxx' }` |
| `boutique/src/admin/lib/grapes/blocks/navigation.ts` | Remove addType calls, content → `{ type }` |
| `boutique/src/admin/lib/grapes/blocks/media.ts` | Remove addType calls, content → `{ type }` |
| `boutique/src/admin/lib/grapes/blocks/interactive.ts` | Remove addType calls, content → `{ type }` |
| `boutique/src/admin/lib/grapes/blocks/ecommerce.ts` | Remove addType call, content → `{ type }` |
| `boutique/src/admin/lib/grapes/blocks/index.ts` | Add registerAllTypes import + call |
| `boutique/src/admin/lib/grapes/editor/GrapesEditor.tsx` | Init order: types → blocks → plugins |

### Track B — New files

| File | Responsibility |
|------|---------------|
| `boutique-storefront/src/lib/cms/sanitize.ts` | sanitizeCmsHtml, stripGjsArtifacts, scopeCmsCss |
| `boutique/src/api/store/cms-pages/slugs/route.ts` | GET /store/cms-pages/slugs — list published slugs |
| `boutique-storefront/src/app/sitemap.ts` | Dynamic sitemap from CMS slugs |
| `boutique-storefront/src/app/robots.ts` | robots.txt with sitemap reference |

### Track B — Files to modify

| File | Change |
|------|--------|
| `boutique-storefront/src/lib/cms/cms-page-renderer.tsx` | Add sanitize/strip/scope pipeline, slug prop, CSS ordering |
| `boutique-storefront/src/lib/data/cms-pages.ts` | Add getAllPublishedCmsSlugs function |
| `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx` | generateStaticParams, JSON-LD, pass slug |
| `boutique-storefront/src/app/[countryCode]/(main)/page.tsx` | JSON-LD, pass slug |

---

## Chunk 1: Phase 0 — Dead Code Removal & TypeScript Strict

### Task 1: Remove Puck legacy fallback from homepage

**Files:**
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/page.tsx`

- [ ] **Step 1: Remove the Puck legacy fallback block**

In `page.tsx`, remove the legacy Puck format handler. The function should return `null` or the fallback Hero/FeaturedProducts when no CMS page exists — not a "legacy format" message.

Replace lines 72-79 (the `// Legacy Puck format - show fallback` block):
```typescript
    // Legacy Puck format - show fallback
    return (
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    )
```

With a simple null return inside the `if (result && region)` block when content has no `gjsHtml` and no layout:
```typescript
    // No GrapesJS content and no layout — fall through to default homepage
```

The existing fallback below (Hero + FeaturedProducts at lines 81-99) already handles this case.

- [ ] **Step 2: Verify the homepage still renders**

Run: `cd boutique-storefront && npx next build 2>&1 | head -30`

The homepage should compile. With a CMS homepage set, it renders CMS content. Without one, it falls through to Hero + FeaturedProducts.

---

### Task 2: Remove Puck legacy fallback from catch-all route

**Files:**
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx`

- [ ] **Step 1: Remove the Puck legacy fallback block**

Replace lines 89-97 (the `// Legacy Puck format fallback` block):
```typescript
  // Legacy Puck format fallback
  return (
    <div>
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    </div>
  )
```

With a `notFound()` call — if there's no GrapesJS content and no layout, the page doesn't exist:
```typescript
  // No renderable content
  notFound()
```

---

### Task 3: Remove stale redirect from next.config.js

**Files:**
- Modify: `boutique-storefront/next.config.js`

- [ ] **Step 1: Remove the `/page/:slug` redirect**

Remove the entire `async redirects()` block (lines 64-72):
```javascript
  async redirects() {
    return [
      {
        source: "/:countryCode/page/:slug*",
        destination: "/:countryCode/:slug*",
        permanent: true,
      },
    ]
  },
```

This redirect was for the old `/page/slug` routing which no longer exists.

---

### Task 4: Enable TypeScript strict on backend

**Files:**
- Modify: `boutique/tsconfig.json`

- [ ] **Step 1: Add strict: true**

Replace `"strictNullChecks": true` with `"strict": true` in the `compilerOptions`:

```json
"strict": true
```

Remove the standalone `"strictNullChecks": true` line since it's included in `strict`.

- [ ] **Step 2: Identify and fix TypeScript errors**

Run: `cd boutique && npx tsc --noEmit 2>&1 | head -100`

Fix errors in CMS-related files:
- `src/admin/lib/grapes/` — type annotations for Editor, Component, Block
- `src/api/admin/cms-pages/` — request/response types
- `src/api/store/cms-pages/` — response types
- `src/modules/cms-page/` — service types

For each error, add proper type annotations. Common patterns:
- `any` → proper type from `grapesjs` or `@medusajs/framework`
- Missing return types on functions
- Implicit `any` parameters

- [ ] **Step 3: Iterate until zero errors**

Run: `cd boutique && npx tsc --noEmit 2>&1 | wc -l`

Target: 0 errors.

---

### Task 5: Disable ignoreBuildErrors on storefront

**Files:**
- Modify: `boutique-storefront/next.config.js`

- [ ] **Step 1: Flip the flags**

Change:
```javascript
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
```

To:
```javascript
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
```

- [ ] **Step 2: Identify TypeScript errors**

Run: `cd boutique-storefront && npx tsc --noEmit 2>&1 | head -200`

- [ ] **Step 3: Fix CMS pipeline errors**

Fix errors in files we own:
- `src/lib/cms/*.ts` and `src/lib/cms/*.tsx`
- `src/lib/data/cms-pages.ts`
- `src/app/[countryCode]/(main)/page.tsx`
- `src/app/[countryCode]/(main)/[...slug]/page.tsx`

- [ ] **Step 4: Fix or suppress upstream errors**

For errors in Medusa starter modules (`src/modules/account/`, `src/modules/cart/`, `src/modules/checkout/`, `src/modules/products/`, etc.):

Add `// @ts-expect-error // TODO: fix upstream type` on lines that fail with types from `@medusajs/*` packages. These are upstream patterns we don't control.

- [ ] **Step 5: Fix ESLint errors**

Run: `cd boutique-storefront && npx next lint 2>&1 | head -100`

Fix or suppress with inline `// eslint-disable-next-line` comments for upstream code.

- [ ] **Step 6: Verify clean build**

Run: `cd boutique-storefront && npx next build 2>&1 | tail -20`

Target: successful build with no TS or ESLint errors.

---

## Chunk 2: Track A — GrapesJS Component Types

### Task 6: Create types/static.ts — 10 static component types

**Files:**
- Create: `boutique/src/admin/lib/grapes/types/static.ts`

- [ ] **Step 1: Create the file with all 10 static component types**

```typescript
import type { Editor } from "grapesjs"

export function registerStaticTypes(editor: Editor) {
  // ─── Heading ────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-heading", {
    isComponent: (el) => el.classList?.contains("cms-heading"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-heading"],
        name: "Heading",
        droppable: false,
        traits: [
          {
            type: "select",
            name: "level",
            label: "Niveau",
            options: [
              { id: "h1", label: "H1" },
              { id: "h2", label: "H2" },
              { id: "h3", label: "H3" },
              { id: "h4", label: "H4" },
              { id: "h5", label: "H5" },
              { id: "h6", label: "H6" },
            ],
            default: "h2",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "h2",
            classes: ["cms-heading__text"],
            content: "Section Title",
            editable: true,
          },
        ],
        styles: `
          .cms-heading { padding: 32px 24px; }
          .cms-heading__text { font-size: 32px; font-weight: 700; color: #111827; text-align: center; margin: 0; }
        `,
      },
      init() {
        this.on("change:level", this.onLevelChange)
      },
      onLevelChange() {
        const heading = this.find(".cms-heading__text")[0]
        if (heading) {
          heading.set("tagName", this.get("level") || "h2")
        }
      },
    },
  })

  // ─── Rich Text ──────────────────────────────────────────────────────────────
  editor.Components.addType("cms-rich-text", {
    isComponent: (el) => el.classList?.contains("cms-rich-text"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-rich-text"],
        name: "Rich Text",
        droppable: true,
        traits: [],
        components: [
          {
            tagName: "h2",
            classes: ["cms-rich-text__title"],
            content: "Your Heading",
            editable: true,
          },
          {
            tagName: "p",
            classes: ["cms-rich-text__body"],
            content: "Write your content here. This is a rich text block where you can add paragraphs of text with a heading above.",
            editable: true,
          },
        ],
        styles: `
          .cms-rich-text { padding: 48px 24px; max-width: 800px; margin: 0 auto; }
          .cms-rich-text__title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 16px 0; }
          .cms-rich-text__body { font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0; }
        `,
      },
    },
  })

  // ─── Spacer ─────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-spacer", {
    isComponent: (el) => el.classList?.contains("cms-spacer"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-spacer"],
        name: "Spacer",
        droppable: false,
        traits: [
          {
            type: "number",
            name: "height",
            label: "Hauteur (px)",
            default: 48,
            min: 8,
            max: 200,
            changeProp: true,
          },
        ],
        styles: `.cms-spacer { height: 48px; }`,
      },
      init() {
        this.on("change:height", this.onHeightChange)
      },
      onHeightChange() {
        const h = this.get("height") || 48
        this.setStyle({ height: `${h}px` })
      },
    },
  })

  // ─── Divider ────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-divider", {
    isComponent: (el) => el.classList?.contains("cms-divider"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-divider"],
        name: "Divider",
        droppable: false,
        traits: [
          {
            type: "color",
            name: "divider-color",
            label: "Couleur",
            default: "#e5e7eb",
            changeProp: true,
          },
        ],
        components: [
          { tagName: "hr", classes: ["cms-divider__line"] },
        ],
        styles: `
          .cms-divider { padding: 24px; }
          .cms-divider__line { border: none; border-top: 1px solid #e5e7eb; max-width: 100%; margin: 0 auto; }
        `,
      },
      init() {
        this.on("change:divider-color", this.onColorChange)
      },
      onColorChange() {
        const hr = this.find(".cms-divider__line")[0]
        if (hr) {
          hr.setStyle({ "border-top-color": this.get("divider-color") || "#e5e7eb" })
        }
      },
    },
  })

  // ─── Hero ───────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-hero", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-hero"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-hero"],
        name: "Hero",
        droppable: true,
        traits: [
          { type: "text", name: "heading", label: "Titre", changeProp: true },
          { type: "text", name: "subheading", label: "Sous-titre", changeProp: true },
          { type: "text", name: "cta-text", label: "Texte du bouton", changeProp: true },
          { type: "text", name: "cta-url", label: "Lien du bouton", changeProp: true },
        ],
        components: [
          { tagName: "div", classes: ["cms-hero__overlay"] },
          {
            tagName: "div",
            classes: ["cms-hero__content"],
            components: [
              { tagName: "h1", classes: ["cms-hero__title"], content: "Welcome to Our Store", editable: true },
              { tagName: "p", classes: ["cms-hero__subtitle"], content: "Discover our latest collection of premium products", editable: true },
              {
                tagName: "div",
                classes: ["cms-hero__actions"],
                components: [
                  { tagName: "a", classes: ["cms-hero__cta"], content: "Shop Now", attributes: { href: "/store" }, editable: true },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-hero { position: relative; width: 100%; min-height: 500px; display: flex; background: #1f2937; }
          .cms-hero__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
          .cms-hero__content { position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; width: 100%; padding: 64px 24px; max-width: 1280px; margin: 0 auto; }
          .cms-hero__title { font-size: 48px; font-weight: 700; color: #ffffff; max-width: 800px; line-height: 1.2; margin: 0; }
          .cms-hero__subtitle { margin-top: 20px; font-size: 18px; color: #ffffff; opacity: 0.9; max-width: 600px; line-height: 1.6; }
          .cms-hero__actions { display: flex; gap: 16px; margin-top: 32px; flex-wrap: wrap; }
          .cms-hero__cta { display: inline-block; padding: 14px 32px; background: #ffffff; color: #000000; font-weight: 600; border-radius: 4px; text-decoration: none; }
        `,
      },
      init() {
        this.on("change:heading", this.syncHeading)
        this.on("change:subheading", this.syncSubheading)
        this.on("change:cta-text", this.syncCtaText)
        this.on("change:cta-url", this.syncCtaUrl)
      },
      syncHeading() { const el = this.find(".cms-hero__title")[0]; if (el) el.set("content", this.get("heading")) },
      syncSubheading() { const el = this.find(".cms-hero__subtitle")[0]; if (el) el.set("content", this.get("subheading")) },
      syncCtaText() { const el = this.find(".cms-hero__cta")[0]; if (el) el.set("content", this.get("cta-text")) },
      syncCtaUrl() { const el = this.find(".cms-hero__cta")[0]; if (el) el.addAttributes({ href: this.get("cta-url") || "/store" }) },
    },
  })

  // ─── CTA ────────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-cta", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-cta"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-cta"],
        name: "Call to Action",
        droppable: true,
        traits: [
          { type: "text", name: "heading", label: "Titre", changeProp: true },
          { type: "text", name: "description", label: "Description", changeProp: true },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-cta__inner"],
            components: [
              { tagName: "h2", classes: ["cms-cta__title"], content: "Ready to get started?", editable: true },
              { tagName: "p", classes: ["cms-cta__desc"], content: "Join thousands of customers who trust us.", editable: true },
              {
                tagName: "div",
                classes: ["cms-cta__actions"],
                components: [
                  { tagName: "a", classes: ["cms-cta__btn-primary"], content: "Get Started", attributes: { href: "/" }, editable: true },
                  { tagName: "a", classes: ["cms-cta__btn-secondary"], content: "Learn More", attributes: { href: "/" }, editable: true },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-cta { background: #111827; padding: 64px 24px; }
          .cms-cta__inner { max-width: 768px; margin: 0 auto; text-align: center; }
          .cms-cta__title { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
          .cms-cta__desc { margin-top: 16px; font-size: 18px; color: #ffffff; opacity: 0.85; line-height: 1.6; }
          .cms-cta__actions { display: flex; gap: 16px; margin-top: 28px; justify-content: center; flex-wrap: wrap; }
          .cms-cta__btn-primary { display: inline-block; padding: 14px 28px; background: #ffffff; color: #111827; font-weight: 600; border-radius: 4px; text-decoration: none; }
          .cms-cta__btn-secondary { display: inline-block; padding: 14px 28px; color: #ffffff; font-weight: 600; border-radius: 4px; text-decoration: none; border: 2px solid #ffffff; }
        `,
      },
      init() {
        this.on("change:heading", this.syncHeading)
        this.on("change:description", this.syncDesc)
      },
      syncHeading() { const el = this.find(".cms-cta__title")[0]; if (el) el.set("content", this.get("heading")) },
      syncDesc() { const el = this.find(".cms-cta__desc")[0]; if (el) el.set("content", this.get("description")) },
    },
  })

  // ─── Features ───────────────────────────────────────────────────────────────
  editor.Components.addType("cms-features", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-features"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-features"],
        name: "Features",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "3",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-features__inner"],
            components: [
              {
                tagName: "div",
                classes: ["cms-features__header"],
                components: [
                  { tagName: "h2", classes: ["cms-features__title"], content: "Why Choose Us", editable: true },
                  { tagName: "p", classes: ["cms-features__subtitle"], content: "Everything you need to succeed", editable: true },
                ],
              },
              {
                tagName: "div",
                classes: ["cms-features__grid"],
                components: [
                  {
                    tagName: "div", classes: ["cms-features__item"],
                    components: [
                      { tagName: "span", classes: ["cms-features__icon"], content: "\u{1F680}" },
                      { tagName: "h3", classes: ["cms-features__item-title"], content: "Fast Delivery", editable: true },
                      { tagName: "p", classes: ["cms-features__item-desc"], content: "Get your products delivered quickly and efficiently", editable: true },
                    ],
                  },
                  {
                    tagName: "div", classes: ["cms-features__item"],
                    components: [
                      { tagName: "span", classes: ["cms-features__icon"], content: "\u{1F512}" },
                      { tagName: "h3", classes: ["cms-features__item-title"], content: "Secure Payment", editable: true },
                      { tagName: "p", classes: ["cms-features__item-desc"], content: "Your transactions are protected with enterprise-grade security", editable: true },
                    ],
                  },
                  {
                    tagName: "div", classes: ["cms-features__item"],
                    components: [
                      { tagName: "span", classes: ["cms-features__icon"], content: "\u{1F4AC}" },
                      { tagName: "h3", classes: ["cms-features__item-title"], content: "24/7 Support", editable: true },
                      { tagName: "p", classes: ["cms-features__item-desc"], content: "Our team is here to help you anytime, anywhere", editable: true },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-features { padding: 64px 24px; background: #ffffff; }
          .cms-features__inner { max-width: 1280px; margin: 0 auto; }
          .cms-features__header { text-align: center; margin-bottom: 48px; }
          .cms-features__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0; }
          .cms-features__subtitle { margin-top: 12px; font-size: 18px; color: #6b7280; }
          .cms-features__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
          .cms-features__item { text-align: center; padding: 16px; }
          .cms-features__icon { font-size: 40px; display: block; margin-bottom: 16px; }
          .cms-features__item-title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
          .cms-features__item-desc { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0; }
        `,
      },
      init() {
        this.on("change:columns", this.onColumnsChange)
      },
      onColumnsChange() {
        const grid = this.find(".cms-features__grid")[0]
        if (grid) {
          grid.setStyle({ "grid-template-columns": `repeat(${this.get("columns") || 3}, 1fr)` })
        }
      },
    },
  })

  // ─── FAQ ────────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-faq", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-faq"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-faq"],
        name: "FAQ",
        droppable: true,
        traits: [],
        components: [
          {
            tagName: "div",
            classes: ["cms-faq__inner"],
            components: [
              {
                tagName: "div",
                classes: ["cms-faq__header"],
                components: [
                  { tagName: "h2", classes: ["cms-faq__title"], content: "Frequently Asked Questions", editable: true },
                  { tagName: "p", classes: ["cms-faq__subtitle"], content: "Find answers to common questions", editable: true },
                ],
              },
              {
                tagName: "div",
                classes: ["cms-faq__list"],
                components: [
                  {
                    tagName: "details", classes: ["cms-faq__item"],
                    components: [
                      { tagName: "summary", classes: ["cms-faq__question"], content: "What is your return policy?", editable: true },
                      { tagName: "p", classes: ["cms-faq__answer"], content: "We offer a 30-day return policy on all items.", editable: true },
                    ],
                  },
                  {
                    tagName: "details", classes: ["cms-faq__item"],
                    components: [
                      { tagName: "summary", classes: ["cms-faq__question"], content: "How long does shipping take?", editable: true },
                      { tagName: "p", classes: ["cms-faq__answer"], content: "Standard shipping takes 3-5 business days.", editable: true },
                    ],
                  },
                  {
                    tagName: "details", classes: ["cms-faq__item"],
                    components: [
                      { tagName: "summary", classes: ["cms-faq__question"], content: "Do you ship internationally?", editable: true },
                      { tagName: "p", classes: ["cms-faq__answer"], content: "Yes! We ship to over 50 countries worldwide.", editable: true },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-faq { padding: 64px 24px; background: #f9fafb; }
          .cms-faq__inner { max-width: 768px; margin: 0 auto; }
          .cms-faq__header { text-align: center; margin-bottom: 40px; }
          .cms-faq__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0; }
          .cms-faq__subtitle { margin-top: 12px; font-size: 18px; color: #4b5563; }
          .cms-faq__list { border-top: 1px solid #e5e7eb; }
          .cms-faq__item { padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
          .cms-faq__question { font-weight: 600; color: #111827; cursor: pointer; list-style: none; }
          .cms-faq__answer { margin-top: 16px; color: #4b5563; line-height: 1.6; }
        `,
      },
    },
  })

  // ─── Image & Text ───────────────────────────────────────────────────────────
  editor.Components.addType("cms-image-text", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-image-text"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-image-text"],
        name: "Image & Text",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "image-position",
            label: "Position image",
            options: [
              { id: "left", label: "Gauche" },
              { id: "right", label: "Droite" },
            ],
            default: "left",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-image-text__inner"],
            components: [
              {
                tagName: "div",
                classes: ["cms-image-text__media"],
                components: [
                  { tagName: "img", classes: ["cms-image-text__img"], attributes: { src: "https://placehold.co/600x400", alt: "Image" } },
                ],
              },
              {
                tagName: "div",
                classes: ["cms-image-text__content"],
                components: [
                  { tagName: "h2", classes: ["cms-image-text__title"], content: "Your Title Here", editable: true },
                  { tagName: "p", classes: ["cms-image-text__desc"], content: "Write a compelling description for this section. Explain your product, service, or story here.", editable: true },
                  { tagName: "a", classes: ["cms-image-text__link"], content: "Learn More", attributes: { href: "/" }, editable: true },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-image-text { padding: 64px 24px; }
          .cms-image-text__inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
          .cms-image-text__img { width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .cms-image-text__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0; }
          .cms-image-text__desc { margin-top: 16px; font-size: 16px; color: #4b5563; line-height: 1.7; }
          .cms-image-text__link { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #111827; color: #ffffff; font-weight: 600; border-radius: 4px; text-decoration: none; }
        `,
      },
      init() {
        this.on("change:image-position", this.onPositionChange)
      },
      onPositionChange() {
        const inner = this.find(".cms-image-text__inner")[0]
        if (!inner) return
        const pos = this.get("image-position") || "left"
        if (pos === "right") {
          inner.setStyle({ direction: "rtl" })
          inner.find("*").forEach((c: any) => c.setStyle({ direction: "ltr" }))
        } else {
          inner.setStyle({ direction: "ltr" })
        }
      },
    },
  })

  // ─── Card Grid ──────────────────────────────────────────────────────────────
  editor.Components.addType("cms-card-grid", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-card-grid"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-card-grid"],
        name: "Card Grid",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "3",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-card-grid__grid"],
            components: Array.from({ length: 3 }, (_, i) => ({
              tagName: "div",
              classes: ["cms-card-grid__card"],
              components: [
                { tagName: "img", classes: ["cms-card-grid__img"], attributes: { src: "https://placehold.co/400x250", alt: `Card ${i + 1}` } },
                {
                  tagName: "div",
                  classes: ["cms-card-grid__body"],
                  components: [
                    { tagName: "h3", classes: ["cms-card-grid__title"], content: "Card Title", editable: true },
                    { tagName: "p", classes: ["cms-card-grid__desc"], content: "Card description goes here.", editable: true },
                    { tagName: "a", classes: ["cms-card-grid__link"], content: "Learn more \u2192", attributes: { href: "/" }, editable: true },
                  ],
                },
              ],
            })),
          },
        ],
        styles: `
          .cms-card-grid { padding: 64px 24px; background: #ffffff; }
          .cms-card-grid__grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .cms-card-grid__card { background: #f9fafb; border-radius: 8px; overflow: hidden; }
          .cms-card-grid__img { width: 100%; height: 200px; object-fit: cover; }
          .cms-card-grid__body { padding: 24px; }
          .cms-card-grid__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0; }
          .cms-card-grid__desc { margin-top: 8px; font-size: 14px; color: #6b7280; line-height: 1.6; }
          .cms-card-grid__link { display: inline-block; margin-top: 16px; font-size: 14px; font-weight: 600; color: #111827; text-decoration: none; }
        `,
      },
      init() {
        this.on("change:columns", this.onColumnsChange)
      },
      onColumnsChange() {
        const grid = this.find(".cms-card-grid__grid")[0]
        if (grid) {
          grid.setStyle({ "grid-template-columns": `repeat(${this.get("columns") || 3}, 1fr)` })
        }
      },
    },
  })
}
```

---

### Task 7: Create types/media.ts — 4 media component types

**Files:**
- Create: `boutique/src/admin/lib/grapes/types/media.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { Editor } from "grapesjs"

export function registerMediaTypes(editor: Editor) {
  // ─── Image ──────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-image", {
    isComponent: (el) => el.tagName === "FIGURE" && el.classList?.contains("cms-image"),
    model: {
      defaults: {
        tagName: "figure",
        classes: ["cms-image"],
        name: "Image",
        droppable: false,
        traits: [],
        components: [
          { tagName: "img", classes: ["cms-image__img"], attributes: { src: "https://placehold.co/800x400", alt: "Image description" } },
          { tagName: "figcaption", classes: ["cms-image__caption"], content: "", editable: true },
        ],
        styles: `
          .cms-image { padding: 32px 24px; text-align: center; }
          .cms-image__img { max-width: 100%; height: auto; border-radius: 8px; }
          .cms-image__caption { margin-top: 8px; font-size: 14px; color: #6b7280; }
        `,
      },
    },
  })

  // ─── Video Embed (hydrated) ─────────────────────────────────────────────────
  editor.Components.addType("video-embed", {
    isComponent: (el) => el.getAttribute?.("data-component") === "video-embed",
    model: {
      defaults: {
        tagName: "div",
        name: "Video Embed",
        droppable: false,
        attributes: { "data-component": "video-embed", "data-url": "", "data-autoplay": "false" },
        traits: [
          { type: "text", name: "data-url", label: "URL de la video" },
          { type: "checkbox", name: "data-autoplay", label: "Lecture automatique" },
        ],
        components: [
          {
            tagName: "div",
            classes: ["video-embed__placeholder"],
            components: [
              { tagName: "p", content: "Configurez l'URL de la video dans les parametres" },
            ],
          },
        ],
        styles: `
          [data-component="video-embed"] { position: relative; padding-top: 56.25%; background: #0f172a; border-radius: 8px; overflow: hidden; }
          .video-embed__placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #94a3b8; font-size: 14px; text-align: center; }
        `,
      },
    },
  })

  // ─── Image Gallery ──────────────────────────────────────────────────────────
  editor.Components.addType("cms-image-gallery", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-image-gallery"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-image-gallery"],
        name: "Image Gallery",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "3",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-image-gallery__grid"],
            components: Array.from({ length: 6 }, () => ({
              tagName: "div",
              classes: ["cms-image-gallery__item"],
              components: [
                { tagName: "img", attributes: { src: "https://placehold.co/400x300", alt: "" }, classes: ["cms-image-gallery__img"] },
              ],
            })),
          },
        ],
        styles: `
          .cms-image-gallery { padding: 40px; }
          .cms-image-gallery__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .cms-image-gallery__item { aspect-ratio: 4/3; background: #f3f4f6; border-radius: 8px; overflow: hidden; }
          .cms-image-gallery__img { width: 100%; height: 100%; object-fit: cover; }
        `,
      },
      init() {
        this.on("change:columns", this.onColumnsChange)
      },
      onColumnsChange() {
        const grid = this.find(".cms-image-gallery__grid")[0]
        if (grid) {
          grid.setStyle({ "grid-template-columns": `repeat(${this.get("columns") || 3}, 1fr)` })
        }
      },
    },
  })

  // ─── Logo Cloud ─────────────────────────────────────────────────────────────
  editor.Components.addType("cms-logo-cloud", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-logo-cloud"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-logo-cloud"],
        name: "Logo Cloud",
        droppable: true,
        traits: [],
        components: [
          {
            tagName: "div",
            classes: ["cms-logo-cloud__inner"],
            components: [
              { tagName: "h3", classes: ["cms-logo-cloud__title"], content: "Ils nous font confiance", editable: true },
              {
                tagName: "div",
                classes: ["cms-logo-cloud__grid"],
                components: Array.from({ length: 6 }, () => ({
                  tagName: "img",
                  classes: ["cms-logo-cloud__logo"],
                  attributes: { src: "https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand", alt: "Brand" },
                })),
              },
            ],
          },
        ],
        styles: `
          .cms-logo-cloud { padding: 64px 24px; background: #f9fafb; }
          .cms-logo-cloud__inner { max-width: 1280px; margin: 0 auto; text-align: center; }
          .cms-logo-cloud__title { font-size: 16px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 40px 0; }
          .cms-logo-cloud__grid { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 40px; }
          .cms-logo-cloud__logo { height: 40px; width: auto; filter: grayscale(1); opacity: 0.5; }
        `,
      },
    },
  })
}
```

---

### Task 8: Create types/navigation.ts — move + enrich 2 types

**Files:**
- Create: `boutique/src/admin/lib/grapes/types/navigation.ts`

- [ ] **Step 1: Create the file with enriched site-header and site-footer types**

Move the `addType` calls from `blocks/navigation.ts` into this file and add `name` property:

```typescript
import type { Editor } from "grapesjs"

export function registerNavigationTypes(editor: Editor) {
  editor.Components.addType("site-header", {
    isComponent: (el) => el.getAttribute?.("data-component") === "site-header",
    model: {
      defaults: {
        tagName: "header",
        name: "Header",
        droppable: true,
        attributes: { "data-component": "site-header" },
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { id: "simple", label: "Simple" },
              { id: "ecommerce", label: "E-commerce" },
              { id: "minimal", label: "Minimal" },
            ],
            default: "simple",
          },
        ],
      },
    },
  })

  editor.Components.addType("site-footer", {
    isComponent: (el) => el.getAttribute?.("data-component") === "site-footer",
    model: {
      defaults: {
        tagName: "footer",
        name: "Footer",
        droppable: true,
        attributes: { "data-component": "site-footer" },
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { id: "full", label: "Complet" },
              { id: "minimal", label: "Minimal" },
            ],
            default: "full",
          },
        ],
      },
    },
  })
}
```

---

### Task 9: Create types/interactive.ts — move + enrich 5 types

**Files:**
- Create: `boutique/src/admin/lib/grapes/types/interactive.ts`

- [ ] **Step 1: Create the file**

Move the `addType` calls from `blocks/interactive.ts` and add `cms-accordion` + `name` properties:

```typescript
import type { Editor } from "grapesjs"

export function registerInteractiveTypes(editor: Editor) {
  // ─── Accordion (static, new type) ──────────────────────────────────────────
  editor.Components.addType("cms-accordion", {
    isComponent: (el) => el.classList?.contains("cms-accordion"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-accordion"],
        name: "Accordion",
        droppable: true,
        traits: [],
        components: [
          {
            tagName: "details", classes: ["cms-accordion__item"],
            components: [
              { tagName: "summary", classes: ["cms-accordion__question"], content: "Question one", editable: true },
              { tagName: "p", classes: ["cms-accordion__answer"], content: "Answer to question one goes here.", editable: true },
            ],
          },
          {
            tagName: "details", classes: ["cms-accordion__item"],
            components: [
              { tagName: "summary", classes: ["cms-accordion__question"], content: "Question two", editable: true },
              { tagName: "p", classes: ["cms-accordion__answer"], content: "Answer to question two goes here.", editable: true },
            ],
          },
          {
            tagName: "details", classes: ["cms-accordion__item"],
            components: [
              { tagName: "summary", classes: ["cms-accordion__question"], content: "Question three", editable: true },
              { tagName: "p", classes: ["cms-accordion__answer"], content: "Answer to question three goes here.", editable: true },
            ],
          },
        ],
        styles: `
          .cms-accordion { max-width: 700px; margin: 0 auto; }
          .cms-accordion__item { border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
          .cms-accordion__question { cursor: pointer; font-weight: 600; font-size: 16px; color: #111827; list-style: none; display: flex; justify-content: space-between; align-items: center; }
          .cms-accordion__answer { margin-top: 12px; color: #6b7280; line-height: 1.6; }
        `,
      },
    },
  })

  // ─── Tabs (hydrated) ───────────────────────────────────────────────────────
  editor.Components.addType("tabs", {
    isComponent: (el) => el.getAttribute?.("data-component") === "tabs",
    model: {
      defaults: {
        name: "Tabs",
        droppable: true,
        attributes: { "data-component": "tabs" },
        traits: [],
      },
    },
  })

  // ─── Stats Counter (hydrated) ──────────────────────────────────────────────
  editor.Components.addType("stats-counter", {
    isComponent: (el) => el.getAttribute?.("data-component") === "stats-counter",
    model: {
      defaults: {
        name: "Stats Counter",
        droppable: true,
        attributes: { "data-component": "stats-counter" },
        traits: [],
      },
    },
  })

  // ─── Testimonials Carousel (hydrated) ──────────────────────────────────────
  editor.Components.addType("testimonials-carousel", {
    isComponent: (el) => el.getAttribute?.("data-component") === "testimonials-carousel",
    model: {
      defaults: {
        name: "Testimonials",
        attributes: { "data-component": "testimonials-carousel" },
        traits: [
          { type: "checkbox", name: "data-autoplay", label: "Autoplay" },
          { type: "number", name: "data-interval", label: "Interval (ms)", default: 5000, min: 1000, max: 15000, step: 500 },
        ],
      },
    },
  })

  // ─── Announcement Bar (hydrated) ───────────────────────────────────────────
  editor.Components.addType("announcement-bar", {
    isComponent: (el) => el.getAttribute?.("data-component") === "announcement-bar",
    model: {
      defaults: {
        name: "Announcement Bar",
        attributes: { "data-component": "announcement-bar" },
        traits: [
          { type: "checkbox", name: "data-dismissible", label: "Dismissible" },
          { type: "text", name: "data-id", label: "Bar ID" },
        ],
      },
    },
  })
}
```

---

### Task 10: Create types/ecommerce.ts — move products-grid

**Files:**
- Create: `boutique/src/admin/lib/grapes/types/ecommerce.ts`

- [ ] **Step 1: Create the file**

Move the `addType` call from `blocks/ecommerce.ts`:

```typescript
import type { Editor } from "grapesjs"

export function registerEcommerceTypes(editor: Editor) {
  editor.Components.addType("products-grid", {
    isComponent: (el) => el.getAttribute?.("data-component") === "products-grid",
    model: {
      defaults: {
        name: "Products Grid",
        attributes: { "data-component": "products-grid" },
        traits: [
          { type: "text", name: "data-collection", label: "Collection Handle" },
          { type: "number", name: "data-limit", label: "Nombre de produits", default: 4, min: 1, max: 12 },
          {
            type: "select",
            name: "data-columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "4",
          },
          { type: "checkbox", name: "data-show-view-all", label: 'Afficher "Voir tout"' },
        ],
        resizable: { tl: 1, tr: 1, bl: 1, br: 1, tc: 1, bc: 1, ml: 1, mr: 1 },
      },
    },
  })
}
```

---

### Task 11: Create types/index.ts — aggregator

**Files:**
- Create: `boutique/src/admin/lib/grapes/types/index.ts`

- [ ] **Step 1: Create the aggregator**

```typescript
import type { Editor } from "grapesjs"
import { registerStaticTypes } from "./static"
import { registerMediaTypes } from "./media"
import { registerNavigationTypes } from "./navigation"
import { registerInteractiveTypes } from "./interactive"
import { registerEcommerceTypes } from "./ecommerce"

export function registerAllTypes(editor: Editor) {
  registerStaticTypes(editor)
  registerMediaTypes(editor)
  registerNavigationTypes(editor)
  registerInteractiveTypes(editor)
  registerEcommerceTypes(editor)
}
```

---

### Task 12: Refactor all blocks/*.ts to reference types

**Files:**
- Modify: `boutique/src/admin/lib/grapes/blocks/basic.ts`
- Modify: `boutique/src/admin/lib/grapes/blocks/sections.ts`
- Modify: `boutique/src/admin/lib/grapes/blocks/navigation.ts`
- Modify: `boutique/src/admin/lib/grapes/blocks/media.ts`
- Modify: `boutique/src/admin/lib/grapes/blocks/interactive.ts`
- Modify: `boutique/src/admin/lib/grapes/blocks/ecommerce.ts`

- [ ] **Step 1: Rewrite basic.ts**

Replace the entire file content:

```typescript
import type { Editor } from "grapesjs"

export function registerBasicBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("heading", {
    label: "Heading",
    category: "Basic",
    content: { type: "cms-heading" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h8"/></svg>',
  })

  bm.add("rich-text", {
    label: "Rich Text",
    category: "Basic",
    content: { type: "cms-rich-text" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 10h16M4 14h10M4 18h14"/></svg>',
  })

  bm.add("spacer", {
    label: "Spacer",
    category: "Basic",
    content: { type: "cms-spacer" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>',
  })

  bm.add("divider", {
    label: "Divider",
    category: "Basic",
    content: { type: "cms-divider" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="12" x2="21" y2="12"/></svg>',
  })
}
```

- [ ] **Step 2: Rewrite sections.ts**

Replace content strings with type references. Keep the same SVG media icons:

```typescript
import type { Editor } from "grapesjs"

export function registerSectionBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("hero", {
    label: "Hero",
    category: "Sections",
    content: { type: "cms-hero" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="14" y2="14"/></svg>',
  })

  bm.add("cta", {
    label: "Call to Action",
    category: "Sections",
    content: { type: "cms-cta" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 15h4M8 11h8"/></svg>',
  })

  bm.add("features", {
    label: "Features",
    category: "Sections",
    content: { type: "cms-features" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  })

  bm.add("faq", {
    label: "FAQ",
    category: "Sections",
    content: { type: "cms-faq" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 015.12-2.13A3 3 0 0112 13v1M12 17h.01"/></svg>',
  })

  bm.add("image-text", {
    label: "Image & Texte",
    category: "Sections",
    content: { type: "cms-image-text" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="8" height="18" rx="1"/><path d="M15 7h6M15 11h6M15 15h4"/></svg>',
  })

  bm.add("card-grid", {
    label: "Grille de cartes",
    category: "Sections",
    content: { type: "cms-card-grid" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="6" height="9" rx="1"/><rect x="9" y="3" width="6" height="9" rx="1"/><rect x="16" y="3" width="6" height="9" rx="1"/></svg>',
  })
}
```

- [ ] **Step 3: Rewrite navigation.ts — remove addType, keep blocks with HTML content**

Navigation blocks keep their HTML content strings because the `site-header`/`site-footer` types don't define default components (the HTML varies by variant). Remove the `addType` calls at the bottom (moved to `types/navigation.ts`):

```typescript
import type { Editor } from "grapesjs"

export function registerNavigationBlocks(editor: Editor) {
  const bm = editor.Blocks

  // Blocks keep HTML content — the type is detected by isComponent via data-component attribute
  bm.add("header-simple", {
    label: "Header Simple",
    category: "Navigation",
    content: `<header data-component="site-header" data-variant="simple" style="width:100%;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="font-size:20px;font-weight:700;color:#111827;text-decoration:none;">Boutique</a>
        <nav style="display:flex;gap:32px;align-items:center;">
          <a href="/" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Boutique</a>
          <a href="/about" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">A propos</a>
          <a href="/contact" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Contact</a>
        </nav>
        <a href="/store" style="display:inline-block;padding:10px 20px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;border-radius:4px;text-decoration:none;">Shop Now</a>
      </div>
    </header>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="4" rx="1"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="16" y2="14"/><line x1="18" y1="14" x2="22" y2="14"/></svg>',
  })

  bm.add("header-ecommerce", {
    label: "Header E-commerce",
    category: "Navigation",
    content: `<header data-component="site-header" data-variant="ecommerce" style="width:100%;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;gap:32px;">
        <a href="/" style="font-size:20px;font-weight:700;color:#111827;text-decoration:none;flex-shrink:0;">Boutique</a>
        <nav style="display:flex;gap:24px;align-items:center;flex:1;">
          <a href="/" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Boutique</a>
          <a href="/about" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">A propos</a>
          <a href="/contact" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Contact</a>
        </nav>
        <div style="display:flex;align-items:center;gap:16px;">
          <span data-slot="search" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128269;</span>
          <span data-slot="account" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128100;</span>
          <span data-slot="cart" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128722;</span>
        </div>
      </div>
    </header>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="4" rx="1"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="18" cy="15" r="2"/><path d="M6 13h4M2 15h4"/></svg>',
  })

  bm.add("header-minimal", {
    label: "Header Minimal",
    category: "Navigation",
    content: `<header data-component="site-header" data-variant="minimal" style="width:100%;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;">
        <span style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#9776;</span>
        <a href="/" style="font-size:18px;font-weight:700;color:#111827;text-decoration:none;position:absolute;left:50%;transform:translateX(-50%);">Boutique</a>
        <span data-slot="cart" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128722;</span>
      </div>
    </header>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="3" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
  })

  bm.add("footer-full", {
    label: "Footer Complet",
    category: "Navigation",
    content: `<footer data-component="site-footer" data-variant="full" style="background:#111827;color:#ffffff;">
      <div style="max-width:1280px;margin:0 auto;padding:64px 24px 40px;">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px;">
          <div>
            <a href="/" style="font-size:22px;font-weight:700;color:#ffffff;text-decoration:none;display:block;margin-bottom:16px;">Boutique</a>
            <p style="font-size:14px;color:#9ca3af;line-height:1.7;max-width:280px;">Votre boutique de confiance pour des produits de qualite.</p>
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#d1d5db;margin-bottom:16px;">Boutique</h4>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
              <li><a href="/store" style="font-size:14px;color:#9ca3af;text-decoration:none;">Tous les produits</a></li>
              <li><a href="/store/nouveautes" style="font-size:14px;color:#9ca3af;text-decoration:none;">Nouveautes</a></li>
              <li><a href="/store/promotions" style="font-size:14px;color:#9ca3af;text-decoration:none;">Promotions</a></li>
            </ul>
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#d1d5db;margin-bottom:16px;">Informations</h4>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
              <li><a href="/about" style="font-size:14px;color:#9ca3af;text-decoration:none;">A propos</a></li>
              <li><a href="/contact" style="font-size:14px;color:#9ca3af;text-decoration:none;">Contact</a></li>
              <li><a href="/livraison" style="font-size:14px;color:#9ca3af;text-decoration:none;">Livraison</a></li>
            </ul>
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#d1d5db;margin-bottom:16px;">Suivez-nous</h4>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <a href="#" style="font-size:14px;color:#9ca3af;text-decoration:none;">Instagram</a>
              <a href="#" style="font-size:14px;color:#9ca3af;text-decoration:none;">Facebook</a>
              <a href="#" style="font-size:14px;color:#9ca3af;text-decoration:none;">TikTok</a>
            </div>
          </div>
        </div>
        <div style="border-top:1px solid #374151;padding-top:24px;display:flex;align-items:center;justify-content:space-between;">
          <p style="font-size:13px;color:#6b7280;">&copy; 2026 Boutique. Tous droits reserves.</p>
          <div style="display:flex;gap:24px;">
            <a href="/cgv" style="font-size:13px;color:#6b7280;text-decoration:none;">CGV</a>
            <a href="/confidentialite" style="font-size:13px;color:#6b7280;text-decoration:none;">Confidentialite</a>
          </div>
        </div>
      </div>
    </footer>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="8" x2="22" y2="8"/><rect x="2" y="8" width="20" height="13" rx="1"/><line x1="7" y1="12" x2="7" y2="18"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="17" y1="12" x2="17" y2="18"/></svg>',
  })

  bm.add("footer-minimal", {
    label: "Footer Minimal",
    category: "Navigation",
    content: `<footer data-component="site-footer" data-variant="minimal" style="background:#f9fafb;border-top:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <a href="/" style="font-size:16px;font-weight:700;color:#111827;text-decoration:none;">Boutique</a>
        <nav style="display:flex;gap:24px;align-items:center;">
          <a href="/cgv" style="font-size:13px;color:#6b7280;text-decoration:none;">CGV</a>
          <a href="/confidentialite" style="font-size:13px;color:#6b7280;text-decoration:none;">Confidentialite</a>
          <a href="/contact" style="font-size:13px;color:#6b7280;text-decoration:none;">Contact</a>
        </nav>
        <p style="font-size:13px;color:#9ca3af;">&copy; 2026 Boutique</p>
      </div>
    </footer>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="16" x2="22" y2="16"/><rect x="2" y="16" width="20" height="5" rx="1"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="12" y1="12" x2="16" y2="12"/></svg>',
  })

  // addType calls REMOVED — moved to types/navigation.ts
}
```

- [ ] **Step 4: Rewrite media.ts — remove addType, rename image-block to image**

```typescript
import type { Editor } from "grapesjs"

export function registerMediaBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("image", {
    label: "Image",
    category: "Media",
    content: { type: "cms-image" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  })

  bm.add("video-embed", {
    label: "Video Embed",
    category: "Media",
    content: { type: "video-embed" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  })

  bm.add("image-gallery", {
    label: "Image Gallery",
    category: "Media",
    content: { type: "cms-image-gallery" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  })

  bm.add("logo-cloud", {
    label: "Logo Cloud",
    category: "Media",
    content: { type: "cms-logo-cloud" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="8" height="4" rx="1"/><rect x="14" y="7" width="8" height="4" rx="1"/><rect x="2" y="14" width="8" height="4" rx="1"/><rect x="14" y="14" width="8" height="4" rx="1"/></svg>',
  })

  // addType calls REMOVED — moved to types/media.ts
}
```

- [ ] **Step 5: Rewrite interactive.ts — remove addType, keep block HTML for hydrated components**

Interactive hydrated blocks keep HTML content (the type is detected via `data-component`). The accordion block references its new type:

```typescript
import type { Editor } from "grapesjs"

export function registerInteractiveBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("accordion", {
    label: "Accordion",
    category: "Interactive",
    content: { type: "cms-accordion" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="4" rx="1"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="3" y="12" width="18" height="4" rx="1"/><line x1="3" y1="18" x2="21" y2="18"/><rect x="3" y="20" width="18" height="4" rx="1"/></svg>',
  })

  bm.add("tabs", {
    label: "Tabs",
    category: "Interactive",
    content: `<div data-component="tabs" style="max-width:800px;margin:0 auto;font-family:inherit;">
  <div style="display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:24px;">
    <button data-tab="0" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:15px;font-weight:600;color:#111827;border-bottom:2px solid #111827;margin-bottom:-2px;">Tab One</button>
    <button data-tab="1" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:15px;font-weight:400;color:#6b7280;">Tab Two</button>
    <button data-tab="2" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:15px;font-weight:400;color:#6b7280;">Tab Three</button>
  </div>
  <div data-tab-panel="0" style="color:#374151;line-height:1.6;"><p>Content for the first tab.</p></div>
  <div data-tab-panel="1" style="display:none;color:#374151;line-height:1.6;"><p>Content for the second tab.</p></div>
  <div data-tab-panel="2" style="display:none;color:#374151;line-height:1.6;"><p>Content for the third tab.</p></div>
</div>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="6" height="3" rx="1"/><rect x="9" y="6" width="6" height="3" rx="1"/><rect x="16" y="6" width="6" height="3" rx="1"/><rect x="2" y="9" width="20" height="10" rx="1"/></svg>',
  })

  bm.add("stats-counter", {
    label: "Stats Counter",
    category: "Interactive",
    content: `<section data-component="stats-counter" style="padding:64px 24px;background:#f9fafb;text-align:center;font-family:inherit;">
  <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:40px;">
    <div>
      <div style="font-size:48px;font-weight:700;color:#111827;line-height:1;"><span data-target="1500">0</span>+</div>
      <div style="margin-top:8px;font-size:16px;color:#6b7280;">Happy Customers</div>
    </div>
    <div>
      <div style="font-size:48px;font-weight:700;color:#111827;line-height:1;"><span data-target="300">0</span>+</div>
      <div style="margin-top:8px;font-size:16px;color:#6b7280;">Products Available</div>
    </div>
    <div>
      <div style="font-size:48px;font-weight:700;color:#111827;line-height:1;"><span data-target="50">0</span>+</div>
      <div style="margin-top:8px;font-size:16px;color:#6b7280;">Countries Served</div>
    </div>
  </div>
</section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="14" width="5" height="7" rx="1"/><rect x="9.5" y="9" width="5" height="12" rx="1"/><rect x="17" y="4" width="5" height="17" rx="1"/></svg>',
  })

  bm.add("testimonials-carousel", {
    label: "Testimonials Carousel",
    category: "Interactive",
    content: `<section data-component="testimonials-carousel" data-autoplay="true" data-interval="5000" style="padding:64px 24px;background:#ffffff;text-align:center;font-family:inherit;">
  <div style="max-width:700px;margin:0 auto;">
    <h2 style="font-size:28px;font-weight:700;color:#111827;margin-bottom:40px;">What Our Customers Say</h2>
    <div style="position:relative;">
      <div data-slide="0" style="color:#374151;">
        <p style="font-size:18px;line-height:1.7;font-style:italic;color:#374151;">"An absolutely amazing product."</p>
        <div style="margin-top:20px;font-weight:600;color:#111827;">Jane Doe</div>
        <div style="font-size:14px;color:#9ca3af;">Verified Customer</div>
      </div>
      <div data-slide="1" style="display:none;color:#374151;">
        <p style="font-size:18px;line-height:1.7;font-style:italic;color:#374151;">"The quality is outstanding."</p>
        <div style="margin-top:20px;font-weight:600;color:#111827;">John Smith</div>
        <div style="font-size:14px;color:#9ca3af;">Verified Customer</div>
      </div>
    </div>
    <div style="display:flex;justify-content:center;gap:8px;margin-top:32px;">
      <button data-dot="0" style="width:10px;height:10px;border-radius:50%;background:#111827;border:none;cursor:pointer;padding:0;"></button>
      <button data-dot="1" style="width:10px;height:10px;border-radius:50%;background:#d1d5db;border:none;cursor:pointer;padding:0;"></button>
    </div>
  </div>
</section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  })

  bm.add("announcement-bar", {
    label: "Announcement Bar",
    category: "Interactive",
    content: `<div data-component="announcement-bar" data-dismissible="true" data-id="promo-1" style="background:#111827;color:#ffffff;text-align:center;padding:10px 40px;font-size:13px;font-family:inherit;position:relative;">
  <span>Free shipping on all orders over $50</span>
  <button data-dismiss style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#ffffff;cursor:pointer;font-size:18px;line-height:1;padding:4px;">\u00D7</button>
</div>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="6" rx="1"/><line x1="6" y1="10" x2="18" y2="10"/><circle cx="19" cy="10" r="0.5" fill="currentColor"/></svg>',
  })

  // addType calls REMOVED — moved to types/interactive.ts
}
```

- [ ] **Step 6: Rewrite ecommerce.ts — remove addType, keep block HTML**

```typescript
import type { Editor } from "grapesjs"

export function registerEcommerceBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("products-grid", {
    label: "Products Grid",
    category: "E-commerce",
    content: `<section data-component="products-grid" data-collection="" data-limit="4" data-columns="4" data-show-view-all="true" style="padding:64px 24px;background:#ffffff;">
      <div style="max-width:1280px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;">
          <div>
            <h2 style="font-size:28px;font-weight:700;color:#111827;">Featured Products</h2>
            <p style="margin-top:8px;color:#6b7280;">Check out our latest arrivals</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;">
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 1</div>
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 2</div>
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 3</div>
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 4</div>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  })

  // addType call REMOVED — moved to types/ecommerce.ts
}
```

---

### Task 13: Update blocks/index.ts and GrapesEditor.tsx

**Files:**
- Modify: `boutique/src/admin/lib/grapes/blocks/index.ts`
- Modify: `boutique/src/admin/lib/grapes/editor/GrapesEditor.tsx`

- [ ] **Step 1: Update blocks/index.ts to register types before blocks**

Add the import and call to `registerAllTypes`:

```typescript
import type { Editor } from "grapesjs"
import { registerAllTypes } from "../types"
import { registerSectionBlocks } from "./sections"
import { registerBasicBlocks } from "./basic"
import { registerEcommerceBlocks } from "./ecommerce"
import { registerNavigationBlocks } from "./navigation"
import { registerMediaBlocks } from "./media"
import { registerInteractiveBlocks } from "./interactive"

// ... SEMANTIC_TAGS, TEXT_TAGS, registerSemanticTagChanger unchanged ...

export function registerAllBlocks(editor: Editor) {
  registerAllTypes(editor)          // ← types FIRST
  registerSemanticTagChanger(editor)
  registerSectionBlocks(editor)
  registerNavigationBlocks(editor)
  registerBasicBlocks(editor)
  registerMediaBlocks(editor)
  registerInteractiveBlocks(editor)
  registerEcommerceBlocks(editor)
}
```

- [ ] **Step 2: Verify GrapesEditor.tsx init order**

The current `handleEditor` in `GrapesEditor.tsx` calls `registerAllBlocks(editor)` which now internally calls `registerAllTypes` first. No change needed to `GrapesEditor.tsx` — the init order is handled inside `registerAllBlocks`.

---

## Chunk 3: Track B — Storefront Pipeline & SEO

### Task 14: Install isomorphic-dompurify

**Files:**
- Modify: `boutique-storefront/package.json`

- [ ] **Step 1: Install the dependency**

Run: `cd boutique-storefront && npm install isomorphic-dompurify`

---

### Task 15: Create sanitize.ts

**Files:**
- Create: `boutique-storefront/src/lib/cms/sanitize.ts`

- [ ] **Step 1: Create the file with 3 pure functions**

```typescript
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

export function scopeCmsCss(css: string, slug: string): string {
  if (!css?.trim()) return ""

  const scope = `[data-cms-page="${slug}"]`

  // Track whether we're inside a @keyframes block
  let inKeyframes = false
  let braceDepth = 0

  const lines = css.split("\n")
  const result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Detect @keyframes start
    if (/^@keyframes\s/.test(trimmed) || /^@-webkit-keyframes\s/.test(trimmed)) {
      inKeyframes = true
      braceDepth = 0
      result.push(line)
      if (trimmed.includes("{")) braceDepth++
      continue
    }

    // Track brace depth inside @keyframes
    if (inKeyframes) {
      for (const ch of trimmed) {
        if (ch === "{") braceDepth++
        if (ch === "}") braceDepth--
      }
      if (braceDepth <= 0) inKeyframes = false
      result.push(line)
      continue
    }

    // Skip other at-rules (don't prefix their "selectors")
    if (trimmed.startsWith("@")) {
      result.push(line)
      continue
    }

    // Skip closing braces and empty lines
    if (!trimmed || trimmed === "}") {
      result.push(line)
      continue
    }

    // Prefix selectors: lines that contain `{`
    if (trimmed.includes("{")) {
      const [selectorsRaw, rest] = trimmed.split("{", 2)
      const selectors = selectorsRaw
        .split(",")
        .map((s) => {
          const sel = s.trim()
          if (!sel || sel === "body" || sel === "html" || sel === "*") return sel
          return `${scope} ${sel}`
        })
        .join(", ")
      result.push(`${selectors} {${rest || ""}`)
    } else {
      result.push(line)
    }
  }

  return result.join("\n")
}
```

---

### Task 16: Refactor CmsPageRenderer

**Files:**
- Modify: `boutique-storefront/src/lib/cms/cms-page-renderer.tsx`

- [ ] **Step 1: Add sanitize imports and slug prop**

Add imports at the top:
```typescript
import { sanitizeCmsHtml, stripGjsArtifacts, scopeCmsCss } from "./sanitize"
```

Add `slug` to the props type:
```typescript
type CmsPageRendererProps = {
  html: string
  css: string
  layout?: CmsLayout | null
  context: RenderContext
  isPreview?: boolean
  slug: string  // ← NEW
}
```

- [ ] **Step 2: Add sanitize/strip/scope pipeline after layout merge**

After the layout merge (line 42), add:
```typescript
  // 2. Sanitize + strip GrapesJS artifacts + scope CSS
  finalHtml = sanitizeCmsHtml(finalHtml)
  finalHtml = stripGjsArtifacts(finalHtml)
  finalCss = scopeCmsCss(finalCss, slug)
```

- [ ] **Step 3: Change the wrapper div**

Replace the existing wrapper:
```tsx
    <div data-cms-full-layout={hideDefaultNav ? "true" : undefined}>
```

With:
```tsx
    <div data-cms-page={slug} data-cms-full-layout={hideDefaultNav ? "true" : undefined}>
```

- [ ] **Step 4: Move CSS style tags before content**

Ensure the `<style>` tags are rendered BEFORE the preview banner and content segments in the JSX output. The current order may already be correct — verify and adjust if needed.

---

### Task 17: Pass slug from route pages

**Files:**
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx`
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/page.tsx`

- [ ] **Step 1: Pass slug in catch-all route**

In the `CmsPageRenderer` JSX call, add `slug={compositeSlug}`:
```tsx
      <CmsPageRenderer
        html={html}
        css={css}
        layout={layout || null}
        context={{ region: region!, countryCode }}
        isPreview={isPreview}
        slug={compositeSlug}
      />
```

- [ ] **Step 2: Pass slug in homepage route**

In the `CmsPageRenderer` JSX call, add `slug="/"`:
```tsx
        <CmsPageRenderer
          html={html}
          css={css}
          layout={layout || null}
          context={{ region, countryCode }}
          slug="/"
        />
```

---

### Task 18: Create /store/cms-pages/slugs API route

**Files:**
- Create: `boutique/src/api/store/cms-pages/slugs/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cmsPageService: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)

  const [pages] = await cmsPageService.listAndCountCmsPages(
    { status: "published" },
    { select: ["id", "slug", "parent_id"] }
  )

  // Build composite slugs for parent/child pages
  const pageMap = new Map(pages.map((p: any) => [p.id, p]))
  const slugs: string[] = []

  for (const page of pages) {
    if ((page as any).slug === "/") continue // Skip homepage root

    if ((page as any).parent_id) {
      const parent = pageMap.get((page as any).parent_id)
      if (parent) {
        slugs.push(`${(parent as any).slug}/${(page as any).slug}`)
      } else {
        slugs.push((page as any).slug)
      }
    } else {
      slugs.push((page as any).slug)
    }
  }

  res.json({ slugs })
}
```

---

### Task 19: Add getAllPublishedCmsSlugs to data layer

**Files:**
- Modify: `boutique-storefront/src/lib/data/cms-pages.ts`

- [ ] **Step 1: Add the function at the end of the store API section (after getCmsPagePreview)**

```typescript
export async function getAllPublishedCmsSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/cms-pages/slugs`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.slugs || []
  } catch {
    return []
  }
}
```

---

### Task 20: Add generateStaticParams and JSON-LD

**Files:**
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx`
- Modify: `boutique-storefront/src/app/[countryCode]/(main)/page.tsx`

- [ ] **Step 1: Add generateStaticParams to catch-all route**

Add after the imports:
```typescript
import { getAllPublishedCmsSlugs } from "@lib/data/cms-pages"

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getAllPublishedCmsSlugs()
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }))
}
```

- [ ] **Step 2: Add JSON-LD to catch-all generateMetadata**

In the `generateMetadata` function, add to the return object:
```typescript
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.seo_meta_title || page.title,
        description: page.seo_meta_description || undefined,
      }),
    },
```

- [ ] **Step 3: Add JSON-LD to homepage generateMetadata**

Same pattern in the homepage `generateMetadata`, inside the `if (result)` block.

---

### Task 21: Create sitemap.ts and robots.ts

**Files:**
- Create: `boutique-storefront/src/app/sitemap.ts`
- Create: `boutique-storefront/src/app/robots.ts`

- [ ] **Step 1: Create sitemap.ts**

```typescript
import type { MetadataRoute } from "next"
import { getAllPublishedCmsSlugs } from "@lib/data/cms-pages"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com"
  const slugs = await getAllPublishedCmsSlugs()

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...slugs.map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
```

- [ ] **Step 2: Create robots.ts**

```typescript
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com"
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
```

---

## Chunk 4: Phase F — Cross-Validation

### Task 22: Validate the full pipeline

- [ ] **Step 1: Build backend**

Run: `cd boutique && npx medusa build 2>&1 | tail -20`

Expected: successful build with no TS errors.

- [ ] **Step 2: Build storefront**

Run: `cd boutique-storefront && npx next build 2>&1 | tail -20`

Expected: successful build with `ignoreBuildErrors: false` — no TS or ESLint errors.

- [ ] **Step 3: Verify GrapesJS editor loads**

Start the dev server and open the admin CMS editor. Verify:
- All block categories appear in the sidebar
- Dragging a block onto the canvas creates a component with proper traits
- The traits panel shows the correct fields for each component type
- Saving a page produces valid `gjsHtml` and `gjsCss`

- [ ] **Step 4: Verify storefront rendering**

Open a published CMS page on the storefront. Verify:
- HTML renders correctly
- CSS is scoped (inspect: `[data-cms-page="slug"]` prefix on selectors)
- No `data-gjs-*` attributes in the DOM
- No `gjs-*` classes in the DOM
- Hydrated components (tabs, carousel, etc.) function correctly

- [ ] **Step 5: Verify SEO**

Check:
- `/sitemap.xml` returns CMS page URLs
- `/robots.txt` references the sitemap
- Page source contains JSON-LD `<script type="application/ld+json">`
- `<meta>` tags populated from CMS SEO fields
