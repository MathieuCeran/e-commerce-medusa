# Template System Refactoring — Design Spec

**Date:** 2026-03-11
**Status:** Approved
**Scope:** CMS template system refactoring — models, API, admin editor, GrapeJS plugins

---

## Goal

Refactor the CMS template system to be clean, modular, and scalable. Split the monolithic 61KB editor into focused components, fix backend hacks (raw knex), add template features (promote blocks, context menu, double-click editing), and clean up all legacy code.

## Decisions

| Question | Decision |
|----------|----------|
| Override system per-property | **No** — not needed |
| Editor separation | **Same page** with toggle page/template mode |
| Switch to template | **Double-click** on a locked template block |
| Promote block to template | **Right-click context menu** — "Ajouter au template" |
| Template management | From page editor dropdown + **default template** in site settings |
| Architecture approach | **Full refactoring** — models + API + admin |

---

## 1. Data Models

### CmsLayout (updated)

| Field | Type | Change |
|-------|------|--------|
| id | string PK | Unchanged |
| name | string unique | Unchanged |
| **description** | text nullable | **New** |
| component_data | JSON array (default `[]`) | **Fix default** from `{}` to `[]` |
| css | text | Unchanged |
| content_position | number | Unchanged |
| **is_default** | boolean default false | **New** |
| html | text | Unchanged — populated on save for storefront rendering |
| created_at, updated_at, deleted_at | timestamps | Unchanged |

**Constraint:** Only one layout can have `is_default = true` at a time. Setting a new default unsets the previous one.

**Note on `html` field:** The `html` field is a compiled render cache. On every template save, `html` is regenerated from `component_data` so the storefront can use it directly without parsing GrapeJS JSON. The editor works with `component_data`; the storefront works with `html` + `css`.

### CmsPage (unchanged)

No model changes. Keeps `layout_id` FK to CmsLayout, `content` JSON, and all existing fields.

**Behavior change:** When creating a page without `layout_id`, the default template (`is_default = true`) is applied automatically.

**Edge case — deleted layout:** When a layout is soft-deleted, all pages referencing it via `layout_id` have their `layout_id` set to `null` in the deleteCmsLayout workflow. This prevents orphaned references.

---

## 2. API Changes

### Fix: CmsLayout API — Remove raw knex

The current `POST /admin/cms-layouts` uses raw knex queries because MedusaService methods crash. This must be fixed:

1. Investigate and fix the CmsLayout model compatibility with MedusaService
2. Replace knex queries with `service.createCmsLayouts()` / `service.updateCmsLayouts()`
3. Add proper workflows: createCmsLayout, updateCmsLayout, deleteCmsLayout
4. Add Zod validators for all endpoints

### Refactored endpoints

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/admin/cms-layouts` | — | List all layouts |
| POST | `/admin/cms-layouts` | `CreateCmsLayoutSchema` (name, description?) | Create a layout |
| GET | `/admin/cms-layouts/:id` | — | Get single layout |
| POST | `/admin/cms-layouts/:id` | `UpdateCmsLayoutSchema` (name?, description?, component_data?, css?, html?, content_position?) | Update a layout |
| DELETE | `/admin/cms-layouts/:id` | — | Soft-delete + null out pages' layout_id |
| POST | `/admin/cms-layouts/:id/set-default` | — | Set as default (unset previous). Auth: `authenticate("user", ["session", "bearer"])` |

**`is_default` is only settable via the `set-default` endpoint**, not via the update endpoint. This prevents accidental conflicts.

### Zod schemas

```ts
const CreateCmsLayoutSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

const UpdateCmsLayoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  component_data: z.array(z.any()).optional(),
  css: z.string().optional(),
  html: z.string().optional(),
  content_position: z.number().int().min(-1).optional(),
})
```

### Middleware registration

All layout endpoints use `authenticate("user", ["session", "bearer"])`. The `set-default` endpoint has no body validator (no body needed). Added to the existing `middlewares.ts` exports.

---

## 3. Admin Code Structure

### Target file tree

```
src/admin/
├── lib/grapes/
│   ├── editor/
│   │   ├── GrapesEditor.tsx        # Core GrapeJS wrapper (init, config, events)
│   │   ├── EditorToolbar.tsx       # Save, publish, devices, undo/redo, Figma button
│   │   ├── EditorSidebar.tsx       # Framer two-panel sidebar (from framer-sidebar.tsx)
│   │   ├── EditorRightPanel.tsx    # Tabs Style/Traits/Layers + template controls
│   │   └── FigmaImportModal.tsx    # Figma import modal (extracted from page.tsx)
│   ├── plugins/
│   │   ├── block-lock.ts           # Lock template blocks in page mode
│   │   ├── context-menu.ts         # Right-click menu: promote/demote blocks
│   │   ├── content-slot.ts         # Content placeholder component
│   │   └── template-sync.ts       # Promote/demote logic between page and template
│   ├── blocks/
│   │   ├── sections.ts             # Hero, CTA, Features, FAQ, Image & Text, Card Grid
│   │   ├── basic.ts                # Heading, Rich Text, Image, Spacer, Divider
│   │   ├── ecommerce.ts            # Products Grid
│   │   └── index.ts                # registerAllBlocks() — imports and registers all
│   ├── theme.ts                    # Framer light theme CSS
│   └── types.ts                    # Shared types (EditorMode, GjsContent, etc.)
├── routes/cms-pages/
│   ├── page.tsx                    # Pages list (unchanged)
│   └── [id]/
│       └── page.tsx                # Slim orchestrator (~200 lines max)
```

### Deleted (legacy)

- `src/admin/lib/grapes/framer-sidebar.tsx` → replaced by `editor/EditorSidebar.tsx`
- `src/admin/lib/grapes/framer-theme.ts` → replaced by `theme.ts`
- `src/admin/lib/grapes/blocks.ts` → split into `blocks/sections.ts`, `blocks/basic.ts`, etc.
- Inline FigmaImportModal in page.tsx → extracted to `editor/FigmaImportModal.tsx`
- Inline helpers (serializeWithStyles, safeGetStyles) → moved to `types.ts`
- The 61KB monolith page.tsx → replaced by ~200 line orchestrator

### Component responsibilities

**page.tsx (orchestrator)**
- Fetch data (page, layouts) via react-query
- State: editorMode, activeLayout
- Compose sub-components
- ~200 lines maximum

**GrapesEditor.tsx**
- Init GrapeJS with config (blockManager custom, canvas styles, devices)
- Register plugins + blocks
- Expose editor instance via `onEditor` callback
- Handle canvas iframe styles injection

**EditorToolbar.tsx**
- Save / publish / unpublish buttons
- Device switcher (Desktop/Tablet/Mobile)
- Undo/Redo
- Figma import button (opens FigmaImportModal)
- Badge showing current mode (page/template)

**EditorSidebar.tsx**
- Framer-style two-panel sidebar
- Category list with search, colored icons
- Block preview grid with drag (via `block:custom` API dragStart/dragStop) and click-to-add
- Receives editor instance as prop

**EditorRightPanel.tsx**
- Tab switcher: Style / Settings / Layers
- Template section: layout dropdown, mode toggle button
- Mounts GrapeJS views-container via DOM manipulation
- Controls specific to active mode

**FigmaImportModal.tsx**
- Figma URL input
- Calls POST /admin/cms-pages/figma-import
- Returns HTML+CSS to parent

---

## 4. GrapeJS Plugins

### block-lock.ts

In page mode, template blocks are visible but untouchable:
- Sets `locked, selectable:false, draggable:false, removable:false, copyable:false`
- Adds `data-tpl-locked="true"` attribute and flags component with `_tpl: true`
- Visual overlay (semi-transparent + lock indicator) via CSS on `[data-tpl-locked]`
- Intercepts `component:remove`, `component:drag` on locked blocks
- **Double-click on locked block** → emits `template:edit-request` event with payload `{ componentId: string }` where `componentId` is the GrapeJS component `cid`. React captures this, switches to template mode, and after canvas rebuild uses `editor.Components.allById()[componentId]` or iterates components to find by `data-tpl-block-id` attribute (a stable UUID set on each template component at save time) and calls `editor.select(component)`.

**Stable identification:** Each template component gets a `data-tpl-block-id` attribute (UUID) stored in `component_data`. This survives canvas rebuilds and allows cross-mode selection.

### context-menu.ts

Custom right-click menu on GrapeJS components:
- **Page mode items:** Select parent, Copy, Duplicate, **"Ajouter au template"**, Delete
- **Template mode items:** Select parent, Copy, Duplicate, **"Retirer du template"**, Delete
- Intercepts `contextmenu` on canvas iframe
- Renders absolutely-positioned div in the editor container (not iframe)
- Emits custom events to React for promote/demote actions
- Dismisses on click outside or Escape key

### content-slot.ts

Content placeholder component (extracted from blocks.ts):
- Custom GrapeJS component type `content-placeholder`
- Not exported in final HTML
- Only one per template (validation on add — if one exists, prevent adding another)
- Draggable to reposition within the template
- Visual: purple dashed zone with icon + "Page content" text
- **Page mode behavior:** The placeholder is never added to the canvas in page mode. The `rebuildPageView` function skips it — it only exists in `component_data` as a position marker. In page mode, actual page content is inserted at that position instead.

### template-sync.ts

Promote/demote logic:

**Promote (page → template):**
1. Serialize the GrapeJS component to JSON
2. Determine insertion index: get the component's index among all wrapper children. If `index < content_position` (i.e., visually above page content), insert at that same index in `component_data` and increment `content_position` by 1. If `index >= content_position + pageComponentCount` (i.e., visually below page content), insert at `index - pageComponentCount` in `component_data` (no change to `content_position`).
3. Add the serialized JSON to layout's `component_data` at the computed index
4. Assign a `data-tpl-block-id` (UUID) to the component for stable identification
5. Remove the component from page content
6. Save template + page via API → rebuild canvas with block now locked

**Demote (template → page) — template mode only:**
1. Get the component's index in `component_data`
2. Remove the component from `component_data`
3. Recalculate `content_position`: if the removed component's index was less than `content_position`, decrement `content_position` by 1. Otherwise, no change.
4. Save template
5. Note: the block disappears from all pages using this template

---

## 5. Editor Flows

### Page mode — Opening a page

1. Fetch page + layout from API
2. Clear canvas
3. Add template blocks before content (from `component_data[0..pos-1]`) → lock them via block-lock plugin
4. Add page content (from `page.content.gjsComponents`)
5. Add template blocks after content (from `component_data[pos..end]`) → lock them
6. Load CSS: page styles + layout CSS rules

### Template mode — Switch

Triggered by: toggle button in right panel, or double-click on a locked block.

1. Stash current page content (serialize components + styles)
2. Clear canvas
3. Load all template `component_data` as editable blocks
4. Insert content-placeholder at `content_position`
5. Load template CSS rules
6. All blocks are fully editable
7. If triggered by double-click: find the component by `data-tpl-block-id` and call `editor.select(component)`

### Save — Page mode

1. Extract page components (filter out `_tpl` flagged and `content-placeholder`)
2. Serialize HTML + CSS + components + styles
3. Filter editor-only styles (outline, etc.)
4. `POST /admin/cms-pages/:id`

### Save — Template mode

1. Extract all components (except content-placeholder)
2. Calculate content_position from placeholder's index among all components
3. Serialize component_data array + CSS + regenerate `html` from editor.getHtml()
4. `POST /admin/cms-layouts/:id` (id-based update, not name-based upsert)
5. Switch back to page mode and rebuild canvas

### Promote flow

1. Right-click block in page mode → "Ajouter au template"
2. Confirmation dialog: "Ce bloc sera partage sur toutes les pages utilisant ce template"
3. Serialize block → compute insertion index using position algorithm (see template-sync.ts section)
4. Remove from page content
5. Save template + page → rebuild canvas with block now locked

---

## 6. Storefront Rendering

Minimal changes. The storefront uses the `html` and `css` fields from CmsLayout (not `component_data`). The `html` field is a compiled render cache regenerated on every template save.

The API `GET /store/cms-pages/:slug` returns the page + layout map (keyed by layout name, containing `html`, `css`, `content_position`). The storefront assembles: `template_html_before + page_html + template_html_after + template_css + page_css`.

**Change needed:** The `buildLayoutMap` utility currently keys by layout `name`, but the page references layouts by `layout_id`. Update `buildLayoutMap` to also include `id` in the returned map entries, and update the storefront to look up by `id` when a page has `layout_id` set.

The new `is_default` and `description` fields don't affect rendering.

---

## 7. Migration

One new migration:
- Add `description` (text, nullable) to `cms_layout`
- Add `is_default` (boolean, default false) to `cms_layout`
- **Fix:** Change `component_data` default from `'{}'` to `'[]'` (the model definition must also change from `model.json().default({} as any)` to `model.json().default([])`)
