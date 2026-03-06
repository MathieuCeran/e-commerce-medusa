# Figma Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to import Figma designs as editable HTML/CSS into the GrapeJS CMS editor.

**Architecture:** Figma token stored in theme_settings DB table (configurable from admin UI). New API endpoint parses Figma URLs, calls Figma REST API to fetch node trees + image exports, converts nodes to HTML/CSS (hybrid: layout as flexbox divs, text as real elements, complex visuals as exported images). Result injected into GrapeJS canvas.

**Tech Stack:** Figma REST API v1 (no npm deps), MedusaJS custom module pattern, GrapeJS editor API, React (admin UI).

---

### Task 1: Add figma_access_token to ThemeSettings model + migration

**Files:**
- Modify: `src/modules/theme-settings/models/theme-settings.ts`
- Create: `src/modules/theme-settings/migrations/Migration20260306140000.ts`

**Step 1: Add field to model**

In `theme-settings.ts`, add after `offer_gift_wrapping`:
```ts
  // Integrations
  figma_access_token: model.text().nullable(),
```

**Step 2: Create migration**

```ts
import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260306140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings"
      add column if not exists "figma_access_token" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "theme_settings"
      drop column if exists "figma_access_token";`);
  }
}
```

**Step 3: Run migration**

```bash
npx medusa db:migrate
```

**Step 4: Commit**

---

### Task 2: Update ThemeSettings API + middleware to support figma_access_token

**Files:**
- Modify: `src/api/admin/theme-settings/middlewares.ts`
- Modify: `src/api/admin/theme-settings/route.ts`

**Step 1: Add to Zod schema in middlewares.ts**

Add to `UpdateThemeSettingsSchema`:
```ts
  figma_access_token: z.string().max(500).nullish(),
```

**Step 2: Add to route.ts types and handlers**

Add `figma_access_token` to `ThemeSettingsBody` type and both `updateData` object and response handling.

**Step 3: Commit**

---

### Task 3: Add Figma token field in Theme Settings admin UI

**Files:**
- Modify: `src/admin/routes/theme-settings/page.tsx`

**Step 1: Add figma_access_token to ThemeSettings type**

**Step 2: Add "Integrations" section in the general-site tab**

New section with a password-type input for the Figma token, with helper text explaining where to get it.

**Step 3: Add to handleSave payload**

**Step 4: Commit**

---

### Task 4: Create Figma-to-HTML converter

**Files:**
- Create: `src/api/admin/cms-pages/figma-import/figma-to-html.ts`

Server-side utility that:
1. Parses Figma URL to extract `fileKey` and `nodeId`
2. Calls `GET /v1/files/:key/nodes?ids=:nodeId` with the token
3. Calls `GET /v1/images/:key?ids=:nodeId&format=png&scale=2` for image exports
4. Recursively converts Figma node tree to HTML/CSS:
   - FRAME with auto-layout → `<div>` with flexbox
   - TEXT → `<h1>`-`<h6>` or `<p>` based on font size
   - RECTANGLE → `<div>` with background/border-radius
   - Nodes with image fills → `<img>` with exported URL
   - VECTOR/complex → exported as image
   - GROUP → `<div>` wrapper

**Step 1: Write parseFigmaUrl()**
**Step 2: Write fetchFigmaNodes()**
**Step 3: Write fetchFigmaImages()**
**Step 4: Write convertNodeToHtml() recursive converter**
**Step 5: Write main figmaToHtml() orchestrator**
**Step 6: Commit**

---

### Task 5: Create Figma import API endpoint

**Files:**
- Create: `src/api/admin/cms-pages/figma-import/route.ts`
- Modify: `src/api/admin/cms-pages/middlewares.ts`

**Step 1: Add middleware for the new route**

```ts
{
  matcher: "/admin/cms-pages/figma-import",
  method: "POST",
  middlewares: [authenticate("user", ["session", "bearer"])],
},
```

**Step 2: Create route handler**

POST endpoint that:
1. Gets `figmaUrl` from request body
2. Resolves themeSettings to get the stored Figma token
3. Calls figmaToHtml converter
4. Returns `{ html, css }`

**Step 3: Commit**

---

### Task 6: Add Import Figma button + modal in GrapeJS editor

**Files:**
- Modify: `src/admin/routes/cms-pages/[id]/page.tsx`

**Step 1: Add FigmaImportModal component**

Modal with:
- Input field for Figma URL
- Import button with loading state
- Error handling display
- Calls `POST /admin/cms-pages/figma-import`
- On success: injects HTML/CSS into GrapeJS via `editor.setComponents()` / `editor.addComponents()`

**Step 2: Add "Import Figma" button in toolbar**

Framer-styled button with Figma icon SVG, positioned in the toolbar right section.

**Step 3: Wire modal open/close state**

**Step 4: Commit**

---
