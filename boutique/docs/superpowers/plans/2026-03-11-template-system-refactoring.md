# Template System Refactoring — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the CMS template system into clean, modular, scalable code — split the 61KB monolith, fix backend hacks, add promote-to-template and context menu features.

**Architecture:** Backend-first approach (models → API → migration), then admin code restructuring (split monolith into focused components), then GrapeJS plugins (block-lock, context-menu, content-slot, template-sync). Each chunk produces working software.

**Tech Stack:** Medusa 2.13.1, GrapeJS 0.22.14, @grapesjs/react 2.0.0, React, TypeScript, Zod, MikroORM

**Spec:** `docs/superpowers/specs/2026-03-11-template-system-refactoring-design.md`

---

## File Map

### New files
| Path | Responsibility |
|------|---------------|
| `src/modules/cms-page/migrations/Migration20260311100000.ts` | Add description, is_default, fix component_data default |
| `src/api/admin/cms-layouts/[id]/set-default/route.ts` | Set layout as default template |
| `src/admin/lib/grapes/types.ts` | Shared types (EditorMode, GjsContent, helpers) |
| `src/admin/lib/grapes/theme.ts` | Framer light theme CSS (from framer-theme.ts) |
| `src/admin/lib/grapes/blocks/sections.ts` | Section blocks (Hero, CTA, Features, FAQ...) |
| `src/admin/lib/grapes/blocks/basic.ts` | Basic blocks (Heading, Rich Text, Image, Spacer, Divider) |
| `src/admin/lib/grapes/blocks/ecommerce.ts` | Products Grid block |
| `src/admin/lib/grapes/blocks/index.ts` | registerAllBlocks() aggregator |
| `src/admin/lib/grapes/editor/GrapesEditor.tsx` | Core GrapeJS wrapper |
| `src/admin/lib/grapes/editor/EditorToolbar.tsx` | Top bar (save, publish, devices) |
| `src/admin/lib/grapes/editor/EditorSidebar.tsx` | Framer two-panel sidebar |
| `src/admin/lib/grapes/editor/EditorRightPanel.tsx` | Right panel (Style/Traits/Layers + template) |
| `src/admin/lib/grapes/editor/FigmaImportModal.tsx` | Figma import modal |
| `src/admin/lib/grapes/plugins/block-lock.ts` | Lock template blocks in page mode |
| `src/admin/lib/grapes/plugins/context-menu.ts` | Right-click menu |
| `src/admin/lib/grapes/plugins/content-slot.ts` | Content placeholder component |
| `src/admin/lib/grapes/plugins/template-sync.ts` | Promote/demote logic |

### Modified files
| Path | What changes |
|------|-------------|
| `src/modules/cms-page/models/cms-layout.ts` | Add description, is_default, fix component_data default |
| `src/modules/cms-page/utils.ts` | Add id to buildLayoutMap output |
| `src/api/admin/cms-layouts/route.ts` | Replace knex with Medusa service methods |
| `src/api/admin/cms-layouts/[id]/route.ts` | Add GET, replace knex DELETE, add POST update |
| `src/api/admin/cms-layouts/middlewares.ts` | New schemas + new routes |
| `src/api/middlewares.ts` | No change needed (already imports layout middlewares) |
| `src/api/store/cms-pages/[slug]/route.ts` | Include id in layout map |
| `src/admin/routes/cms-pages/[id]/page.tsx` | Complete rewrite — slim orchestrator |

### Deleted files
| Path | Replaced by |
|------|------------|
| `src/admin/lib/grapes/framer-sidebar.tsx` | `editor/EditorSidebar.tsx` |
| `src/admin/lib/grapes/framer-theme.ts` | `theme.ts` |
| `src/admin/lib/grapes/blocks.ts` | `blocks/sections.ts`, `blocks/basic.ts`, etc. |

---

## Chunk 1: Backend — Models, Migration, API

### Task 1: Update CmsLayout model

**Files:**
- Modify: `src/modules/cms-page/models/cms-layout.ts`

- [ ] **Step 1: Update the model definition**

Replace the full file content with:

```ts
import { model } from "@medusajs/framework/utils"

const CmsLayout = model.define("cms_layout", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  html: model.text().default(""),
  css: model.text().default(""),
  component_data: model.json().default([]),
  content_position: model.number().default(-1),
  is_default: model.boolean().default(false),
})

export default CmsLayout
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/cms-page/models/cms-layout.ts
git commit -m "feat(cms): add description, is_default to CmsLayout, fix component_data default"
```

---

### Task 2: Create migration

**Files:**
- Create: `src/modules/cms-page/migrations/Migration20260311100000.ts`

- [ ] **Step 1: Write the migration**

```ts
import { Migration } from "@mikro-orm/migrations"

export class Migration20260311100000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "cms_layout" ADD COLUMN IF NOT EXISTS "description" text NULL;`
    )
    this.addSql(
      `ALTER TABLE "cms_layout" ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false;`
    )
    this.addSql(
      `ALTER TABLE "cms_layout" ALTER COLUMN "component_data" SET DEFAULT '[]';`
    )
    // Fix existing rows that have {} as component_data
    this.addSql(
      `UPDATE "cms_layout" SET "component_data" = '[]' WHERE "component_data"::text = '{}';`
    )
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "cms_layout" DROP COLUMN IF EXISTS "description";`)
    this.addSql(`ALTER TABLE "cms_layout" DROP COLUMN IF EXISTS "is_default";`)
    this.addSql(
      `ALTER TABLE "cms_layout" ALTER COLUMN "component_data" SET DEFAULT '{}';`
    )
  }
}
```

- [ ] **Step 2: Run the migration**

```bash
npx medusa db:migrate
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/cms-page/migrations/Migration20260311100000.ts
git commit -m "feat(cms): migration for description, is_default, component_data default fix"
```

---

### Task 3: Rewrite CmsLayout middlewares

**Files:**
- Modify: `src/api/admin/cms-layouts/middlewares.ts`

- [ ] **Step 1: Replace with proper schemas and routes**

```ts
import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "zod"

export const CreateCmsLayoutSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})
export type CreateCmsLayoutSchema = z.infer<typeof CreateCmsLayoutSchema>

export const UpdateCmsLayoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  component_data: z.array(z.any()).optional(),
  css: z.string().optional(),
  html: z.string().optional(),
  content_position: z.number().int().min(-1).optional(),
})
export type UpdateCmsLayoutSchema = z.infer<typeof UpdateCmsLayoutSchema>

const auth = authenticate("user", ["session", "bearer"])

export const adminCmsLayoutsMiddlewares: MiddlewareRoute[] = [
  { matcher: "/admin/cms-layouts", method: "GET", middlewares: [auth] },
  {
    matcher: "/admin/cms-layouts",
    method: "POST",
    middlewares: [auth, validateAndTransformBody(CreateCmsLayoutSchema)],
  },
  { matcher: "/admin/cms-layouts/:id", method: "GET", middlewares: [auth] },
  {
    matcher: "/admin/cms-layouts/:id",
    method: "POST",
    middlewares: [auth, validateAndTransformBody(UpdateCmsLayoutSchema)],
  },
  { matcher: "/admin/cms-layouts/:id", method: "DELETE", middlewares: [auth] },
  {
    matcher: "/admin/cms-layouts/:id/set-default",
    method: "POST",
    middlewares: [auth],
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/api/admin/cms-layouts/middlewares.ts
git commit -m "feat(cms): rewrite layout middlewares with proper schemas"
```

---

### Task 4: Rewrite CmsLayout API routes — remove knex

**Files:**
- Modify: `src/api/admin/cms-layouts/route.ts`
- Modify: `src/api/admin/cms-layouts/[id]/route.ts`
- Create: `src/api/admin/cms-layouts/[id]/set-default/route.ts`

- [ ] **Step 1: Rewrite the main route (list + create)**

Replace `src/api/admin/cms-layouts/route.ts`:

```ts
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../modules/cms-page"
import type CmsPageModuleService from "../../../modules/cms-page/service"
import type { CreateCmsLayoutSchema } from "./middlewares"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const layouts = await service.listCmsLayouts({}, { order: { name: "ASC" } })
  res.json({ layouts })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateCmsLayoutSchema>,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const layout = await service.createCmsLayouts(req.validatedBody)
  res.status(201).json({ layout })
}
```

- [ ] **Step 2: Rewrite the [id] route (get, update, delete)**

Replace `src/api/admin/cms-layouts/[id]/route.ts`:

```ts
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import type CmsPageModuleService from "../../../../modules/cms-page/service"
import type { UpdateCmsLayoutSchema } from "../middlewares"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const layout = await service.retrieveCmsLayout(req.params.id)
  if (!layout) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Layout not found")
  res.json({ layout })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateCmsLayoutSchema>,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const layout = await service.updateCmsLayouts(req.params.id, req.validatedBody)
  res.json({ layout })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)

  // Null out layout_id on all pages referencing this layout
  const pages = await service.listCmsPages({ layout_id: req.params.id })
  for (const page of pages) {
    await service.updateCmsPages(page.id, { layout_id: null })
  }

  await service.softDeleteCmsLayouts(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
```

- [ ] **Step 3: Create the set-default endpoint**

Create `src/api/admin/cms-layouts/[id]/set-default/route.ts`:

```ts
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../../modules/cms-page"
import type CmsPageModuleService from "../../../../../modules/cms-page/service"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)

  // Unset current default
  const currentDefaults = await service.listCmsLayouts({ is_default: true })
  for (const layout of currentDefaults) {
    await service.updateCmsLayouts(layout.id, { is_default: false })
  }

  // Set new default
  const layout = await service.updateCmsLayouts(req.params.id, { is_default: true })
  res.json({ layout })
}
```

- [ ] **Step 4: Test the API manually**

Start the dev server and verify:
```bash
npx medusa develop
```
- `GET /admin/cms-layouts` returns layouts with new fields
- `POST /admin/cms-layouts` creates a layout (without knex)
- `POST /admin/cms-layouts/:id` updates a layout
- `DELETE /admin/cms-layouts/:id` soft-deletes and nulls out pages
- `POST /admin/cms-layouts/:id/set-default` sets default

- [ ] **Step 5: Commit**

```bash
git add src/api/admin/cms-layouts/
git commit -m "feat(cms): rewrite layout API with proper Medusa service methods, remove knex"
```

---

### Task 5: Update buildLayoutMap utility and store API

**Files:**
- Modify: `src/modules/cms-page/utils.ts`
- Modify: `src/api/store/cms-pages/[slug]/route.ts`

- [ ] **Step 1: Update buildLayoutMap to include id**

Replace `src/modules/cms-page/utils.ts`:

```ts
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
```

- [ ] **Step 2: Update the store route to pass id**

Read `src/api/store/cms-pages/[slug]/route.ts` and ensure the `listCmsLayouts` call includes the `id` field in the select. The `buildLayoutMap` call should now pass through `id` automatically since `listCmsLayouts` returns full objects.

- [ ] **Step 3: Commit**

```bash
git add src/modules/cms-page/utils.ts src/api/store/cms-pages/
git commit -m "feat(cms): include layout id in buildLayoutMap for storefront"
```

---

## Chunk 2: Admin Code — Split the Monolith

### Task 6: Create shared types and helpers

**Files:**
- Create: `src/admin/lib/grapes/types.ts`

- [ ] **Step 1: Create types.ts with shared types and helpers**

Extract from the current `page.tsx` (lines 16-81 equivalent):

```ts
import type { Editor } from "grapesjs"

export type EditorMode = "page" | "template"

export type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: any
  gjsStyles?: any
}

export type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_og_image_url: string | null
  content: Record<string, any>
  layout_id: string | null
  preview_token: string | null
  updated_at: string
}

export type CmsLayout = {
  id: string
  name: string
  description: string | null
  html: string
  css: string
  component_data: any[]
  content_position: number
  is_default: boolean
}

const EDITOR_ONLY_STYLES = new Set([
  "outline", "outline-color", "outline-style", "outline-width", "outline-offset",
])

export function safeGetStyles(editor: Editor): any {
  try {
    return JSON.parse(JSON.stringify(editor.getStyle()))
  } catch {
    return []
  }
}

export function serializeWithStyles(editor: Editor) {
  const wrapper = editor.getWrapper()
  if (!wrapper) return { components: [], styles: [] }
  const components = wrapper.components().map((c: any) => c.toJSON())
  const styles = safeGetStyles(editor)
  return { components, styles }
}

export function filterEditorStyles(styles: any[]): any[] {
  if (!Array.isArray(styles)) return styles
  return styles.map((rule: any) => {
    if (!rule.style) return rule
    const filtered = { ...rule.style }
    for (const key of EDITOR_ONLY_STYLES) delete filtered[key]
    return { ...rule, style: filtered }
  })
}

// --- Component Prop Interfaces ---
// These serve as contracts between the orchestrator and sub-components.
// The orchestrator owns all state and passes callbacks down.

export type EditorToolbarProps = {
  editor: Editor | null
  page: CmsPage
  editorMode: EditorMode
  activeDevice: string
  isSaving: boolean
  onSave: () => void
  onPublish: () => void
  onUnpublish: () => void
  onDeviceChange: (device: string) => void
  onFigmaImport: (html: string, css: string) => void
  onNavigateBack: () => void
}

export type EditorSidebarProps = {
  editor: Editor | null
}

export type EditorRightPanelProps = {
  editor: Editor | null
  editorMode: EditorMode
  layouts: CmsLayout[]
  activeLayoutId: string | null
  onLayoutChange: (layoutId: string | null) => void
  onToggleMode: () => void
  onCreateTemplate: (name: string) => void
}

export type GrapesEditorProps = {
  onEditor: (editor: Editor) => void
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/types.ts
git commit -m "feat(cms): create shared types and helpers for GrapeJS editor"
```

---

### Task 7: Move theme to new location

**Files:**
- Create: `src/admin/lib/grapes/theme.ts`
- Delete: `src/admin/lib/grapes/framer-theme.ts`

- [ ] **Step 1: Copy framer-theme.ts to theme.ts**

Copy the entire content of `src/admin/lib/grapes/framer-theme.ts` to `src/admin/lib/grapes/theme.ts`. No code changes needed — just the file rename.

- [ ] **Step 2: Delete the old file**

```bash
rm src/admin/lib/grapes/framer-theme.ts
```

- [ ] **Step 3: Update imports in page.tsx**

In `src/admin/routes/cms-pages/[id]/page.tsx`, change:
```ts
// Old
import { injectFramerTheme, removeFramerTheme } from "../../../lib/grapes/framer-theme"
// New
import { injectFramerTheme, removeFramerTheme } from "../../../lib/grapes/theme"
```

- [ ] **Step 4: Commit**

```bash
git add src/admin/lib/grapes/theme.ts src/admin/routes/cms-pages/
git rm src/admin/lib/grapes/framer-theme.ts
git commit -m "refactor(cms): rename framer-theme.ts to theme.ts"
```

---

### Task 8: Split blocks into categories

**Files:**
- Create: `src/admin/lib/grapes/blocks/sections.ts`
- Create: `src/admin/lib/grapes/blocks/basic.ts`
- Create: `src/admin/lib/grapes/blocks/ecommerce.ts`
- Create: `src/admin/lib/grapes/blocks/index.ts`
- Delete: `src/admin/lib/grapes/blocks.ts`

- [ ] **Step 1: Read the current blocks.ts**

Read `src/admin/lib/grapes/blocks.ts` fully. Identify each block and its category:
- **Sections**: hero-section, cta-section, features-section, faq-section, image-text-section, card-grid-section
- **Basic**: heading-block, rich-text-block, image-block, spacer-block, divider-block
- **E-commerce**: products-grid

Also identify helper code:
- `registerSemanticTagChanger` — goes in `index.ts`
- `registerContentPlaceholder` — will move to `plugins/content-slot.ts` later
- `addContentPlaceholder`, `getContentPlaceholderIndex` — will move to `plugins/content-slot.ts` later

- [ ] **Step 2: Create sections.ts**

Extract all section blocks into `src/admin/lib/grapes/blocks/sections.ts`:

```ts
import type { Editor } from "grapesjs"

export function registerSectionBlocks(editor: Editor) {
  // Move each editor.Blocks.add() call for section blocks here
  // hero-section, cta-section, features-section, faq-section,
  // image-text-section, card-grid-section
}
```

Each block keeps its exact `content` HTML string and `media` SVG from the original file.

- [ ] **Step 3: Create basic.ts**

Extract basic blocks into `src/admin/lib/grapes/blocks/basic.ts`:

```ts
import type { Editor } from "grapesjs"

export function registerBasicBlocks(editor: Editor) {
  // heading-block, rich-text-block, image-block, spacer-block, divider-block
}
```

- [ ] **Step 4: Create ecommerce.ts**

Extract products grid into `src/admin/lib/grapes/blocks/ecommerce.ts`:

```ts
import type { Editor } from "grapesjs"

export function registerEcommerceBlocks(editor: Editor) {
  // products-grid with traits
}
```

- [ ] **Step 5: Create index.ts aggregator**

Create `src/admin/lib/grapes/blocks/index.ts`:

```ts
import type { Editor } from "grapesjs"
import { registerSectionBlocks } from "./sections"
import { registerBasicBlocks } from "./basic"
import { registerEcommerceBlocks } from "./ecommerce"

function registerSemanticTagChanger(editor: Editor) {
  // Move registerSemanticTagChanger code here
}

export function registerAllBlocks(editor: Editor) {
  registerSemanticTagChanger(editor)
  registerSectionBlocks(editor)
  registerBasicBlocks(editor)
  registerEcommerceBlocks(editor)
}
```

Note: `registerContentPlaceholder`, `addContentPlaceholder`, `getContentPlaceholderIndex` are NOT included here — they move to `plugins/content-slot.ts` in Chunk 3.

- [ ] **Step 6: Delete old blocks.ts**

```bash
rm src/admin/lib/grapes/blocks.ts
```

- [ ] **Step 7: Update imports in page.tsx temporarily**

Change the import from:
```ts
import { registerBlocks, addContentPlaceholder, getContentPlaceholderIndex } from "../../../lib/grapes/blocks"
```
to:
```ts
import { registerAllBlocks } from "../../../lib/grapes/blocks/index"
// content-placeholder functions will be imported from plugins/content-slot.ts after Chunk 3
```

- [ ] **Step 8: Commit**

```bash
git add src/admin/lib/grapes/blocks/
git rm src/admin/lib/grapes/blocks.ts
git add src/admin/routes/cms-pages/
git commit -m "refactor(cms): split blocks.ts into category files"
```

---

### Task 9: Extract FigmaImportModal

**Files:**
- Create: `src/admin/lib/grapes/editor/FigmaImportModal.tsx`

- [ ] **Step 1: Extract the FigmaImportModal component**

Read `page.tsx` and find the `FigmaImportModal` component (currently inline). Extract it into its own file:

```tsx
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { sdk } from "../../../lib/client"

type FigmaImportModalProps = {
  onClose: () => void
  onImport: (html: string, css: string) => void
}

export function FigmaImportModal({ onClose, onImport }: FigmaImportModalProps) {
  // Move the full FigmaImportModal code here — exact same logic
  // It uses: useState for figmaUrl/error, useMutation for API call,
  // handleSubmit, and the full JSX with form/input/buttons
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/editor/FigmaImportModal.tsx
git commit -m "refactor(cms): extract FigmaImportModal into own component"
```

---

### Task 10: Create EditorToolbar

**Files:**
- Create: `src/admin/lib/grapes/editor/EditorToolbar.tsx`

- [ ] **Step 1: Create EditorToolbar component**

Extract the toolbar section from page.tsx. The toolbar contains: back button, title, mode badge, device switcher, undo/redo, Figma button, save/publish buttons.

```tsx
import { useState } from "react"
import type { Editor } from "grapesjs"
import type { EditorMode, CmsPage } from "../types"
import { FigmaImportModal } from "./FigmaImportModal"

type EditorToolbarProps = {
  editor: Editor | null
  page: CmsPage
  editorMode: EditorMode
  activeDevice: string
  isSaving: boolean
  onSave: () => void
  onPublish: () => void
  onUnpublish: () => void
  onDeviceChange: (device: string) => void
  onFigmaImport: (html: string, css: string) => void
  onNavigateBack: () => void
}

export function EditorToolbar({
  editor,
  page,
  editorMode,
  activeDevice,
  isSaving,
  onSave,
  onPublish,
  onUnpublish,
  onDeviceChange,
  onFigmaImport,
  onNavigateBack,
}: EditorToolbarProps) {
  const [showFigma, setShowFigma] = useState(false)

  // Move the full toolbar JSX here:
  // - Back arrow button
  // - Page title
  // - Mode badge (page/template)
  // - Device switcher (Desktop/Tablet/Mobile pill buttons)
  // - Undo/Redo buttons using editor.UndoManager
  // - Figma import button
  // - Save / Publish / Unpublish buttons
  // - Status indicator
  // - FigmaImportModal conditional render
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/editor/EditorToolbar.tsx
git commit -m "refactor(cms): extract EditorToolbar component"
```

---

### Task 11: Create EditorSidebar

**Files:**
- Create: `src/admin/lib/grapes/editor/EditorSidebar.tsx`
- Delete: `src/admin/lib/grapes/framer-sidebar.tsx`

- [ ] **Step 1: Move framer-sidebar.tsx to EditorSidebar.tsx**

Copy `src/admin/lib/grapes/framer-sidebar.tsx` to `src/admin/lib/grapes/editor/EditorSidebar.tsx`. Rename the export from `FramerSidebar` to `EditorSidebar`.

Key changes:
- Rename component: `FramerSidebar` → `EditorSidebar`
- Keep all existing logic (block:custom drag, categories, search)
- Update any imports if needed

- [ ] **Step 2: Delete old file**

```bash
rm src/admin/lib/grapes/framer-sidebar.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/lib/grapes/editor/EditorSidebar.tsx
git rm src/admin/lib/grapes/framer-sidebar.tsx
git commit -m "refactor(cms): rename FramerSidebar to EditorSidebar, move to editor/"
```

---

### Task 12: Create EditorRightPanel

**Files:**
- Create: `src/admin/lib/grapes/editor/EditorRightPanel.tsx`

- [ ] **Step 1: Extract the right panel from page.tsx**

The right panel contains: tab switcher (Style/Settings/Layers), template controls (layout dropdown, edit template button, create template), and the GrapeJS views-container mount point.

```tsx
import { useState, useCallback, useEffect, useRef } from "react"
import type { Editor } from "grapesjs"
import type { EditorMode, CmsLayout } from "../types"

type EditorRightPanelProps = {
  editor: Editor | null
  editorMode: EditorMode
  layouts: CmsLayout[]
  activeLayoutId: string | null
  onLayoutChange: (layoutId: string | null) => void
  onToggleMode: () => void
  onCreateTemplate: (name: string) => void
}

export function EditorRightPanel({
  editor,
  editorMode,
  layouts,
  activeLayoutId,
  onLayoutChange,
  onToggleMode,
  onCreateTemplate,
}: EditorRightPanelProps) {
  const [activeTab, setActiveTab] = useState<"style" | "traits" | "layers">("style")
  const viewsRef = useRef<HTMLDivElement>(null)

  // Move the GrapeJS views-container mounting logic here
  // Move the tab switching logic (switchRightTab) here
  // Move the full right panel JSX:
  //   - Tab switcher with SVG icons
  //   - Template section (layout select, edit button, +new)
  //   - <div ref={viewsRef} /> for GrapeJS views-container
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/editor/EditorRightPanel.tsx
git commit -m "refactor(cms): extract EditorRightPanel component"
```

---

### Task 13: Create GrapesEditor wrapper

**Files:**
- Create: `src/admin/lib/grapes/editor/GrapesEditor.tsx`

- [ ] **Step 1: Create the core GrapeJS wrapper**

This wraps `@grapesjs/react` GjsEditor with all our configuration:

```tsx
import { useCallback } from "react"
import grapesjs, { Editor } from "grapesjs"
import GjsEditor from "@grapesjs/react"
import gjsPresetWebpage from "grapesjs-preset-webpage"
import { registerAllBlocks } from "../blocks"
import { injectFramerTheme } from "../theme"

type GrapesEditorProps = {
  onEditor: (editor: Editor) => void
}

export function GrapesEditor({ onEditor }: GrapesEditorProps) {
  const handleEditor = useCallback(
    (editor: Editor) => {
      injectFramerTheme()
      registerAllBlocks(editor)

      // Inject canvas iframe styles
      editor.Canvas.getFrameEl()?.addEventListener("load", () => {
        const doc = editor.Canvas.getDocument()
        if (doc) {
          const style = doc.createElement("style")
          style.textContent = `body { margin: 0; padding: 0; min-height: auto; }`
          doc.head.appendChild(style)
        }
      })

      onEditor(editor)
    },
    [onEditor]
  )

  return (
    <GjsEditor
      grapesjs={grapesjs}
      grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
      plugins={[gjsPresetWebpage]}
      options={{
        height: "100%",
        storageManager: false,
        blockManager: { custom: true },
        canvas: {
          styles: [
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          ],
        },
        deviceManager: {
          devices: [
            { name: "Desktop", width: "" },
            { name: "Tablet", width: "768px", widthMedia: "992px" },
            { name: "Mobile", width: "375px", widthMedia: "480px" },
          ],
        },
      }}
      onEditor={handleEditor}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/editor/GrapesEditor.tsx
git commit -m "refactor(cms): create GrapesEditor core wrapper"
```

---

### Task 14: Rewrite page.tsx as slim orchestrator

**Files:**
- Modify: `src/admin/routes/cms-pages/[id]/page.tsx` (complete rewrite)

- [ ] **Step 1: Rewrite as orchestrator**

The new page.tsx should be ~200 lines. It:
- Fetches page + layouts data via react-query
- Manages top-level state (editorMode, editor ref, activeLayout)
- Composes: EditorToolbar, EditorSidebar, GrapesEditor, EditorRightPanel
- Contains the `rebuildPageView`, `doSave`, `enterTemplateMode`, `exitTemplateMode` functions
- Delegates all rendering to sub-components

```tsx
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useRef } from "react"
import type { Editor } from "grapesjs"
import { sdk } from "../../../lib/client"
import { GrapesEditor } from "../../../lib/grapes/editor/GrapesEditor"
import { EditorToolbar } from "../../../lib/grapes/editor/EditorToolbar"
import { EditorSidebar } from "../../../lib/grapes/editor/EditorSidebar"
import { EditorRightPanel } from "../../../lib/grapes/editor/EditorRightPanel"
import {
  type EditorMode,
  type CmsPage,
  type CmsLayout,
  serializeWithStyles,
  filterEditorStyles,
} from "../../../lib/grapes/types"

// ... data fetching, state, rebuildPageView, save functions
// ... layout with: Toolbar | Sidebar | Canvas | RightPanel
```

Key structure:
```
┌─────────────────────────────────────────────┐
│  EditorToolbar                              │
├───────────┬───────────────────┬─────────────┤
│           │                   │             │
│  Editor   │   GrapesEditor    │  Editor     │
│  Sidebar  │   (canvas)        │  RightPanel │
│           │                   │             │
└───────────┴───────────────────┴─────────────┘
```

- [ ] **Step 2: Test the editor loads and works**

Start dev server, navigate to a CMS page editor. Verify:
- Editor loads with Framer theme
- Sidebar shows blocks with categories
- Right panel shows Style/Traits/Layers tabs
- Template controls work (layout dropdown, mode toggle)
- Save/publish/unpublish work
- Figma import works

- [ ] **Step 3: Commit**

```bash
git add src/admin/routes/cms-pages/[id]/page.tsx
git commit -m "refactor(cms): rewrite page editor as slim orchestrator (~200 lines)"
```

---

## Chunk 3: GrapeJS Plugins

### Task 15: Create content-slot plugin

**Files:**
- Create: `src/admin/lib/grapes/plugins/content-slot.ts`

- [ ] **Step 1: Extract content-placeholder logic from old blocks.ts**

Move `registerContentPlaceholder`, `addContentPlaceholder`, `getContentPlaceholderIndex` into the plugin:

```ts
import type { Editor } from "grapesjs"

export function contentSlotPlugin(editor: Editor) {
  // Register the content-placeholder component type
  editor.DomComponents.addType("content-placeholder", {
    isComponent: (el) => el.getAttribute?.("data-type") === "content-placeholder",
    model: {
      defaults: {
        tagName: "div",
        droppable: false,
        copyable: false,
        removable: false,
        draggable: true,
        selectable: true,
        hoverable: true,
        badgable: false,
        layerable: true,
        highlightable: false,
        attributes: { "data-type": "content-placeholder" },
        components: [],
        traits: [],
        style: {
          "min-height": "400px",
          background: "rgba(168, 85, 247, 0.08)",
          border: "2px dashed rgba(168, 85, 247, 0.35)",
          "border-radius": "12px",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          gap: "12px",
          padding: "32px",
        },
      },
    },
    view: {
      onRender({ el }) {
        el.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="rgba(168,85,247,0.5)" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M12 8v8M8 12h8" stroke-linecap="round"/>
          </svg>
          <span style="color:rgba(168,85,247,0.6);font-size:13px;font-weight:500;">
            Page content
          </span>
        `
      },
    },
  })
}

export function addContentPlaceholder(editor: Editor): void {
  const wrapper = editor.getWrapper()
  if (!wrapper) return
  // Prevent duplicates
  const existing = wrapper.components().filter(
    (c: any) => c.get("type") === "content-placeholder"
  )
  if (existing.length > 0) return
  editor.addComponents({ type: "content-placeholder" })
}

/**
 * Prevent duplicate content-placeholder via drag or any other add mechanism.
 * Must be called after the plugin registers the component type.
 */
export function guardContentPlaceholderDuplicates(editor: Editor): void {
  editor.on("component:add", (component: any) => {
    if (component.get("type") !== "content-placeholder") return
    const wrapper = editor.getWrapper()
    const existing = wrapper?.components().filter(
      (c: any) => c.get("type") === "content-placeholder" && c !== component
    )
    if (existing && existing.length > 0) {
      component.remove()
    }
  })
}

export function getContentPlaceholderIndex(editor: Editor): number {
  const wrapper = editor.getWrapper()
  if (!wrapper) return -1
  const comps = wrapper.components().models
  return comps.findIndex((c: any) => c.get("type") === "content-placeholder")
}
```

- [ ] **Step 2: Register the plugin in GrapesEditor.tsx**

Add to the `handleEditor` callback in `GrapesEditor.tsx`:
```ts
import { contentSlotPlugin, guardContentPlaceholderDuplicates } from "../plugins/content-slot"
// in handleEditor:
contentSlotPlugin(editor)
guardContentPlaceholderDuplicates(editor)
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/lib/grapes/plugins/content-slot.ts
git add src/admin/lib/grapes/editor/GrapesEditor.tsx
git commit -m "feat(cms): create content-slot plugin (extracted from blocks.ts)"
```

---

### Task 16: Create block-lock plugin

**Files:**
- Create: `src/admin/lib/grapes/plugins/block-lock.ts`

- [ ] **Step 1: Create the block lock plugin**

```ts
import type { Editor } from "grapesjs"

export function blockLockPlugin(editor: Editor) {
  // Lock a component and all its children
  function lockComponent(comp: any, isRoot = true) {
    comp.set({
      locked: true,
      selectable: false,
      hoverable: false,
      editable: false,
      draggable: false,
      removable: false,
      copyable: false,
      highlightable: false,
    })
    if (isRoot) {
      comp.set("_tpl", true)
      comp.addAttributes({ "data-tpl-locked": "true" })
      // Ensure every template root block has a stable UUID for cross-mode identification
      if (!comp.getAttributes()["data-tpl-block-id"]) {
        comp.addAttributes({ "data-tpl-block-id": crypto.randomUUID() })
      }
    }
    comp.components().forEach((child: any) => lockComponent(child, false))
  }

  // Unlock a component and all its children
  function unlockComponent(comp: any) {
    comp.set({
      locked: false,
      selectable: true,
      hoverable: true,
      editable: true,
      draggable: true,
      removable: true,
      copyable: true,
      highlightable: true,
      _tpl: false,
    })
    comp.removeAttributes("data-tpl-locked")
    comp.components().forEach((child: any) => unlockComponent(child))
  }

  // Double-click on locked block → emit event to switch to template mode.
  // NOTE: We use raw DOM event because GrapeJS does NOT fire component:dblclick
  // on components with selectable:false. We intercept directly on the canvas iframe.
  const attachDblClick = () => {
    const frameDoc = editor.Canvas.getFrameEl()?.contentDocument
    if (!frameDoc) return
    frameDoc.addEventListener("dblclick", (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-tpl-locked]")
      if (target) {
        const blockId = target.getAttribute("data-tpl-block-id")
        if (blockId) {
          editor.trigger("template:edit-request", { componentId: blockId })
        }
      }
    })
  }
  // Canvas iframe may reload, so attach on every frame load
  editor.on("canvas:frame:load", attachDblClick)
  // Also attach immediately if frame is already loaded
  attachDblClick()

  // Expose functions on the editor for external use
  ;(editor as any).__blockLock = { lockComponent, unlockComponent }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/plugins/block-lock.ts
git commit -m "feat(cms): create block-lock plugin with double-click template switch"
```

---

### Task 17: Create context-menu plugin

**Files:**
- Create: `src/admin/lib/grapes/plugins/context-menu.ts`

- [ ] **Step 1: Create the context menu plugin**

```ts
import type { Editor } from "grapesjs"

export function contextMenuPlugin(editor: Editor) {
  let menuEl: HTMLElement | null = null

  function createMenu() {
    const el = document.createElement("div")
    el.id = "gjs-context-menu"
    el.style.cssText = `
      position:fixed; z-index:9999; display:none;
      background:#fff; border:1px solid #e8e8e8; border-radius:10px;
      padding:6px; min-width:180px;
      box-shadow:0 8px 24px rgba(0,0,0,0.08);
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
      font-size:13px;
    `
    document.body.appendChild(el)
    return el
  }

  function hideMenu() {
    if (menuEl) menuEl.style.display = "none"
  }

  function showMenu(x: number, y: number, items: MenuItem[]) {
    if (!menuEl) menuEl = createMenu()
    menuEl.innerHTML = items
      .map((item) => {
        if (item.separator) return `<div style="border-top:1px solid #f0f0f0;margin:4px 0;"></div>`
        return `<div class="ctx-item" data-action="${item.action}"
          style="padding:7px 12px;border-radius:6px;cursor:pointer;color:${item.color || "#333"};
          font-weight:${item.bold ? "500" : "400"};transition:background 0.1s;"
          onmouseenter="this.style.background='#f5f5f5'"
          onmouseleave="this.style.background='transparent'"
        >${item.label}</div>`
      })
      .join("")

    menuEl.style.left = x + "px"
    menuEl.style.top = y + "px"
    menuEl.style.display = "block"

    menuEl.querySelectorAll(".ctx-item").forEach((el) => {
      el.addEventListener("click", () => {
        const action = (el as HTMLElement).dataset.action
        if (action) editor.trigger("context-menu:" + action, selectedComponent)
        hideMenu()
      })
    })
  }

  type MenuItem = {
    label?: string
    action?: string
    color?: string
    bold?: boolean
    separator?: boolean
  }

  let selectedComponent: any = null

  // Listen for right-click on canvas iframe.
  // NOTE: GrapeJS does NOT have a native "component:contextmenu" event.
  // We intercept the raw DOM contextmenu event on the canvas iframe document.
  const attachContextMenu = () => {
    const frameDoc = editor.Canvas.getFrameEl()?.contentDocument
    if (!frameDoc) return
    frameDoc.addEventListener("contextmenu", (e: MouseEvent) => {
      e.preventDefault()
      const target = e.target as HTMLElement
      // Walk up to find a GrapeJS component wrapper
      let el: HTMLElement | null = target
      let comp: any = null
      while (el && !comp) {
        // GrapeJS stores component reference on DOM elements
        comp = (el as any).__gjsv?.model || null
        if (!comp) el = el.parentElement
      }
      if (!comp) return

      selectedComponent = comp
      editor.select(comp) // Select it so actions like clone work

      const isTpl = comp.get("_tpl")
      const mode = (editor as any).__editorMode || "page"

      handleContextMenuShow(e.clientX, e.clientY, isTpl, mode)
    })
  }
  editor.on("canvas:frame:load", attachContextMenu)
  attachContextMenu()

  function handleContextMenuShow(x: number, y: number, isTpl: boolean, mode: string) {

    const items: MenuItem[] = [
      { label: "Selectionner le parent", action: "select-parent" },
      { label: "Copier", action: "copy" },
      { label: "Dupliquer", action: "duplicate" },
      { separator: true },
    ]

    if (mode === "page" && !isTpl) {
      items.push({
        label: "Ajouter au template ↑",
        action: "promote",
        color: "#0099ff",
        bold: true,
      })
      items.push({ separator: true })
    }

    if (mode === "template" && !component.get("type")?.includes("content-placeholder")) {
      items.push({
        label: "Retirer du template ↓",
        action: "demote",
        color: "#ff9500",
        bold: true,
      })
      items.push({ separator: true })
    }

    if (!isTpl) {
      items.push({ label: "Supprimer", action: "delete", color: "#ff3b30" })
    }

    showMenu(x, y, items)
  }

  // Handle built-in actions
  editor.on("context-menu:select-parent", (comp: any) => {
    const parent = comp.parent()
    if (parent) editor.select(parent)
  })
  editor.on("context-menu:copy", () => editor.runCommand("core:copy"))
  editor.on("context-menu:duplicate", () => editor.runCommand("tlb-clone"))
  editor.on("context-menu:delete", (comp: any) => comp.remove())

  // Close on click outside / Escape
  const onDocClick = () => hideMenu()
  const onDocKeydown = (e: KeyboardEvent) => { if (e.key === "Escape") hideMenu() }
  document.addEventListener("click", onDocClick)
  document.addEventListener("keydown", onDocKeydown)

  // Cleanup on editor destroy to prevent listener leaks
  editor.on("destroy", () => {
    document.removeEventListener("click", onDocClick)
    document.removeEventListener("keydown", onDocKeydown)
    menuEl?.remove()
    menuEl = null
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/plugins/context-menu.ts
git commit -m "feat(cms): create context-menu plugin with promote/demote options"
```

---

### Task 18: Create template-sync plugin

**Files:**
- Create: `src/admin/lib/grapes/plugins/template-sync.ts`

- [ ] **Step 1: Create the template sync plugin**

```ts
import type { Editor } from "grapesjs"

export function templateSyncPlugin(editor: Editor) {
  // Promote: move a page block into the template
  editor.on("context-menu:promote", (component: any) => {
    editor.trigger("template:promote-request", { component })
  })

  // Demote: remove a block from the template
  editor.on("context-menu:demote", (component: any) => {
    editor.trigger("template:demote-request", { component })
  })
}

/**
 * Calculate where to insert a promoted block in component_data.
 * Returns { insertIndex, newContentPosition }.
 */
export function computePromotePosition(
  componentIndex: number,
  contentPosition: number,
  pageComponentCount: number
): { insertIndex: number; newContentPosition: number } {
  if (componentIndex < contentPosition) {
    // Block is above the content slot → insert at same index, shift content_position
    return {
      insertIndex: componentIndex,
      newContentPosition: contentPosition + 1,
    }
  } else if (componentIndex >= contentPosition + pageComponentCount) {
    // Block is below the content slot → insert after content in template data
    const relativeIndex = componentIndex - contentPosition - pageComponentCount
    return {
      insertIndex: contentPosition + relativeIndex,
      newContentPosition: contentPosition,
    }
  } else {
    // Block is within the page content range — should not be promoted via this path
    throw new Error("Cannot promote: component is within page content range")
  }
}

/**
 * Recalculate content_position after demoting (removing) a block from template.
 */
export function computeDemotePosition(
  removedIndex: number,
  contentPosition: number
): number {
  if (removedIndex < contentPosition) {
    return contentPosition - 1
  }
  return contentPosition
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/lib/grapes/plugins/template-sync.ts
git commit -m "feat(cms): create template-sync plugin with promote/demote logic"
```

---

### Task 19: Wire plugins into GrapesEditor and orchestrator

**Files:**
- Modify: `src/admin/lib/grapes/editor/GrapesEditor.tsx`
- Modify: `src/admin/routes/cms-pages/[id]/page.tsx`

- [ ] **Step 1: Register all plugins in GrapesEditor.tsx**

```ts
import { blockLockPlugin } from "../plugins/block-lock"
import { contextMenuPlugin } from "../plugins/context-menu"
import { contentSlotPlugin } from "../plugins/content-slot"
import { templateSyncPlugin } from "../plugins/template-sync"

// In handleEditor:
contentSlotPlugin(editor)
blockLockPlugin(editor)
contextMenuPlugin(editor)
templateSyncPlugin(editor)
```

- [ ] **Step 2: Wire template events in page.tsx orchestrator**

In the orchestrator's `onEditor` callback, listen for plugin events:

```ts
// Double-click on template block → switch to template mode
editor.on("template:edit-request", ({ componentId }) => {
  enterTemplateMode(componentId)
})

// Promote request from context menu
editor.on("template:promote-request", ({ component }) => {
  handlePromote(component)
})

// Demote request from context menu
editor.on("template:demote-request", ({ component }) => {
  handleDemote(component)
})

// Set editor mode for context menu to read (initial value)
;(editor as any).__editorMode = editorMode
```

**Important:** `__editorMode` must be updated on every mode change. In the orchestrator, add a `useEffect`:
```ts
useEffect(() => {
  if (editorRef.current) {
    ;(editorRef.current as any).__editorMode = editorMode
  }
}, [editorMode])
```

Implement `handlePromote` and `handleDemote` in the orchestrator using `computePromotePosition` and `computeDemotePosition` from template-sync.

**`handlePromote` must include a confirmation dialog** before executing:
```ts
const confirmed = window.confirm("Ce bloc sera partagé sur toutes les pages utilisant ce template")
if (!confirmed) return
```

- [ ] **Step 3: Test the full flow**

1. Open a page with a template
2. Verify template blocks are locked
3. Double-click a template block → switches to template mode
4. Right-click a page block → "Ajouter au template" appears
5. Promote a block → it becomes part of the template (locked in page mode)
6. In template mode, right-click → "Retirer du template" works
7. Save in both modes works correctly

- [ ] **Step 4: Commit**

```bash
git add src/admin/lib/grapes/editor/GrapesEditor.tsx
git add src/admin/routes/cms-pages/[id]/page.tsx
git commit -m "feat(cms): wire all plugins into editor, implement promote/demote flows"
```

---

### Task 20: Final cleanup — delete legacy, verify everything

- [ ] **Step 1: Verify no remaining imports to deleted files**

Search for any references to old file paths:
```bash
grep -r "framer-sidebar" src/admin/ --include="*.ts" --include="*.tsx"
grep -r "framer-theme" src/admin/ --include="*.ts" --include="*.tsx"
grep -r "grapes/blocks\"" src/admin/ --include="*.ts" --include="*.tsx"
```

Fix any remaining imports.

- [ ] **Step 2: Verify the editor works end-to-end**

Manual test checklist:
- [ ] Page editor loads with Framer theme
- [ ] Sidebar categories show, blocks are draggable and clickable
- [ ] Right panel tabs work (Style/Settings/Layers)
- [ ] Template dropdown works, mode toggle works
- [ ] Save page content works
- [ ] Save template works
- [ ] Publish/unpublish works
- [ ] Figma import works
- [ ] Template blocks are locked in page mode
- [ ] Double-click template block → switches to template mode
- [ ] Right-click context menu shows with promote/demote
- [ ] Promote block to template works
- [ ] Demote block from template works
- [ ] Content placeholder is draggable in template mode
- [ ] New pages get default template if set

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(cms): complete template system refactoring

- Split 61KB monolithic editor into focused components
- Fix layout API: remove raw knex, use Medusa service methods
- Add block-lock, context-menu, content-slot, template-sync plugins
- Add promote-to-template via right-click context menu
- Add double-click to edit template mode
- Add default template support (is_default field)
- Split blocks.ts into category files
- Clean up all legacy files"
```
