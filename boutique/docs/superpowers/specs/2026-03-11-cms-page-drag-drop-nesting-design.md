# CMS Page Drag-and-Drop Ordering & Nesting

> **For agentic workers:** This is a design spec. Use superpowers:writing-plans to create the implementation plan.

**Goal:** Allow admin users to reorder CMS pages via drag-and-drop in the pages list, and nest pages as sub-pages by dropping them onto a parent page. Sub-page URLs are SEO-friendly with hierarchical slugs.

---

## 1. Data Model

Two new columns on `cms_page`:

| Column | Type | Default | Description |
|---|---|---|---|
| `parent_id` | `text`, nullable | `null` | References another `cms_page.id`. `null` = root page. |
| `position` | `integer` | `0` | Sort order among siblings (same parent). Lower = higher. |

### Constraints

- Max depth = 1: a page with `parent_id != null` cannot itself be a parent (reject if any page already has this page as `parent_id`).
- `parent_id` cannot reference itself.
- `parent_id` cannot reference a page that already has a `parent_id` (no grandchildren).
- System page (`is_system = true`) cannot be a sub-page.
- System page cannot receive children.
- **Unique constraint** on `(parent_id, slug)` pair — two sibling pages (same parent) cannot share the same slug. Note: there is currently no unique index on `slug` in the DB (confirmed via snapshot). The new composite unique index must handle PostgreSQL's `NULL != NULL` behavior for `parent_id`. Use `COALESCE(parent_id, '__root__')` in the index expression so root pages (where `parent_id IS NULL`) are correctly deduplicated: `CREATE UNIQUE INDEX "cms_page_parent_slug_unique" ON "cms_page" (COALESCE(parent_id, '__root__'), slug);`
- **Deleting a parent page**: all its children are promoted to root level (`parent_id` set to `null`) and assigned sequential positions at the end of the root list.

### Slug Composition (computed, not stored)

The `slug` column stores only the page's own slug (e.g., `equipe`). The full URL path is computed:

- Root page: `/{slug}` (e.g., `/a-propos`)
- Sub-page: `/{parent.slug}/{slug}` (e.g., `/a-propos/equipe`)

The `/page/` prefix is removed from all CMS page URLs for cleaner SEO.

### Default Position on Create

When creating a page without an explicit `position`, it is assigned `max(position) + 1` among its siblings (same `parent_id`). This ensures new pages appear at the end of the list.

### Reserved Slugs

Pages cannot be created with slugs that conflict with existing storefront routes. The following slugs must be **added to** the existing `RESERVED_SLUGS` array in `boutique/src/api/admin/cms-pages/route.ts` (which already contains `"/", "home", "homepage", "accueil"`):

```
account, cart, categories, collections, order, page, preview, products, store
```

The complete merged array:
```js
const RESERVED_SLUGS = ["/", "home", "homepage", "accueil", "account", "cart", "categories", "collections", "order", "page", "preview", "products", "store"]
```

---

## 2. API Backend

### Modified Endpoints

**`GET /admin/cms-pages`**
- Returns pages with `parent_id`, `position` fields
- DB sort: `{ order: { position: "ASC" } }` (replaces current `{ order: { updated_at: "DESC" } }`)
- The response is a **flat list**. The admin UI client is responsible for building the tree structure (grouping children under their parent). This avoids complex server-side tree serialization.
- Includes computed `children_count` for each page. Implementation: after fetching all pages, compute in JS by counting `pages.filter(p => p.parent_id === page.id).length` per page. Since we fetch all pages at once for the tree, this is O(n) with no extra queries.

**`POST /admin/cms-pages` (create)**
- Accepts optional `parent_id` and `position` in body
- Validates: parent exists, parent is a root page, parent is not a system page, depth constraint

**`POST /admin/cms-pages/:id` (update)**
- Accepts optional `parent_id` and `position` in body
- Same validations as create, plus: cannot set `parent_id` if page has children

**Schemas** (`middlewares.ts`):
- Add `parent_id: z.string().nullish()` and `position: z.number().int().min(0).optional()` to both `CreateCmsPageSchema` and `UpdateCmsPageSchema`

### New Endpoint

**`POST /admin/cms-pages/reorder`**

Batch update positions and parent assignments after a drag-and-drop operation.

Request body:
```json
{
  "items": [
    { "id": "page_1", "parent_id": null, "position": 0 },
    { "id": "page_2", "parent_id": null, "position": 1 },
    { "id": "page_3", "parent_id": "page_2", "position": 0 }
  ]
}
```

Validations:
- All IDs must exist
- All parent_id references must be valid (exist, root-level, not system)
- No cycles, no depth > 1
- System pages cannot be moved to have a parent

Response: `{ success: true }`

Middleware: `authenticate("user", ["session", "bearer"])` + body validation with `z.object({ items: z.array(z.object({ id: z.string(), parent_id: z.string().nullable(), position: z.number().int().min(0) })) })`

**Important:** The reorder middleware matcher (`/admin/cms-pages/reorder`, method POST) must be listed **before** the `/:id` matcher in the middlewares array. Otherwise Medusa will match `reorder` as an `:id` parameter and apply the `UpdateCmsPageSchema` validation, which will reject the `items` payload.

### Modified Store Endpoints

**`GET /store/cms-pages/:slug`**

The composite slug is passed as a **query parameter** instead of a path parameter to avoid Express `%2F` path decoding issues:

- `GET /store/cms-pages?slug=a-propos` → root page
- `GET /store/cms-pages?slug=a-propos/equipe` → sub-page

This replaces the current `GET /store/cms-pages/:slug` path-based route with a query-based route at `GET /store/cms-pages`.

Resolution logic:
1. Read `slug` from `req.query.slug`, split on `/`
2. If 1 segment: find page where `slug = segment` and `parent_id IS NULL` and `status = published`
3. If 2 segments: find parent where `slug = segments[0]` and `parent_id IS NULL`, then find child where `slug = segments[1]` and `parent_id = parent.id` and `status = published`
4. If 3+ segments: return 404

The response is unchanged: `{ page, layout }`.

**`GET /store/cms-pages/preview?slug=...&token=...`** — same composite slug resolution via query param, ignoring status filter.

---

## 3. Admin UI — Drag-and-Drop Tree List

### Library: `@dnd-kit/core` + `@dnd-kit/sortable`

- ~15kb gzipped, well-maintained (25k+ GitHub stars)
- Built-in keyboard accessibility for drag-and-drop
- Touch support
- Activation delay sensor (300ms hold before drag starts, prevents accidental drags on click)

### Visual Structure

```
[grip] [v] A propos            [published]  [Edit] [Delete]
             [grip] Notre equipe   [draft]  [Edit] [Delete]
             [grip] Nos valeurs    [published]  [Edit] [Delete]
[grip] [v] Blog                [published]  [Edit] [Delete]
             [grip] Article 1      [published]  [Edit] [Delete]
[grip]     Contact             [published]  [Edit] [Delete]
        Homepage (system)      [published]  [Edit]
```

- **Grip handle** (6-dot icon) on the left of each row for drag initiation
- **Chevron** (`v` / `>`) on parent pages to expand/collapse children
- **Indentation** (~32px) for sub-pages with a subtle left border
- **System page** (homepage): not draggable, no grip handle, no delete button, always at the bottom

### Drag-and-Drop Behaviors

| Action | Visual Indicator | Result |
|---|---|---|
| Drag root page between root pages | Blue horizontal line between rows | Reorder root pages |
| Hold root page over another root page (~300ms) | Target row highlights with blue background | Dropped page becomes child of target |
| Drag sub-page between siblings | Blue horizontal line between sub-pages | Reorder within same parent |
| Drag sub-page onto a different root page | Target root page highlights | Sub-page changes parent |
| Drag sub-page to gap between root pages | Blue horizontal line at root level | Sub-page becomes root page |
| Drag parent page (has children) | Group moves together, children shown as compact ghost | Entire group repositioned |

### Visual Feedback During Drag

- Dragged element: elevated shadow, slight opacity reduction (0.85)
- Drop zone "between": 2px blue horizontal line
- Drop zone "onto parent": subtle blue background highlight on target row
- Invalid drop (e.g., onto system page, onto a sub-page): red indicator or no highlight

### Expand/Collapse State

- Collapsed by default on page load
- Expand/collapse state stored in React state (not persisted)
- Dragging a page over a collapsed parent auto-expands it after 500ms

### Save Behavior

- After each drop, send `POST /admin/cms-pages/reorder` with the full updated tree order
- Optimistic update: UI reorders immediately, rolls back on error
- Success toast: "Ordre sauvegarde" (small, bottom-right, auto-dismiss 2s)
- Error toast: "Erreur lors de la sauvegarde" with rollback

---

## 4. Storefront Routing

### Route Change

**Before:** `app/[countryCode]/(main)/page/[slug]/page.tsx`
**After:** `app/[countryCode]/(main)/[...slug]/page.tsx`

This removes the `/page/` prefix from URLs and supports hierarchical slugs.

**Route conflict analysis:** All sibling routes under `(main)/` are static segments: `account/`, `cart/`, `categories/`, `collections/`, `order/`, `products/`, `store/`, `preview/`. None are dynamic segments. In Next.js App Router, static segments always take priority over catchall `[...slug]`, so there are no conflicts. The catchall only matches paths that don't match any existing static route.

The `params.slug` changes from `string` to `string[]`:
- `["a-propos"]` → root page
- `["a-propos", "equipe"]` → sub-page
- `["a-propos", "equipe", "truc"]` → 404

### Preview Handling

Preview is handled **inside the catchall** `[...slug]/page.tsx` itself. No separate preview route.

Detection: if `searchParams.token` is present, the page fetches via the preview API instead of the published API. The slug `"preview"` is in the reserved slugs list, so no CMS page can have that slug.

- `["a-propos"]` + `?token=xxx` → preview mode for "a-propos"
- `["a-propos", "equipe"]` + `?token=xxx` → preview mode for sub-page

The old separate preview route files are deleted.

### GjsRenderer and Products Grid

The existing `gjs-renderer.tsx` and `products-grid-server.tsx` components move alongside the new `[...slug]` route. No logic changes needed — they receive the same `html`/`css` props.

### Homepage

The homepage route (`app/[countryCode]/(main)/page.tsx`) is unchanged. It uses `slug = "/"` and doesn't go through the catchall.

Homepage preview (`app/[countryCode]/(main)/preview/page.tsx`) is also unchanged.

### SEO

- `generateMetadata` works with the slug array, joining segments to build the full slug for the API call
- Canonical URLs: `/{countryCode}/{parent-slug}/{child-slug}`
- Sub-pages inherit the same meta tag pattern as root pages

### 404 Handling

The catchall **must call `notFound()`** (from `next/navigation`) when:
- The API returns no page for the given slug
- The slug has more than 2 segments
- The slug matches a pattern that is clearly not a CMS page

This ensures Next.js renders a proper 404 page instead of a blank CMS error.

### Backwards Compatibility

Existing pages with no parent continue to work. URLs change from `/page/slug` to `/slug` — a redirect from `/page/*` to `/*` should be added for any bookmarked/indexed URLs:

In `next.config.js`:
```js
redirects: [
  { source: "/:countryCode/page/:slug*", destination: "/:countryCode/:slug*", permanent: true }
]
```

---

## 5. Files Affected

### Backend (boutique)

| File | Action |
|---|---|
| `src/modules/cms-page/models/cms-page.ts` | Add `parent_id`, `position` columns |
| `src/modules/cms-page/migrations/Migration<timestamp>.ts` | New migration (see SQL below) |
| `src/api/admin/cms-pages/route.ts` | Update GET (sort, children_count), extend reserved slugs |
| `src/api/admin/cms-pages/middlewares.ts` | Add `parent_id`, `position` to schemas, add reorder schema |
| `src/api/admin/cms-pages/reorder/route.ts` | New endpoint for batch reorder |
| `src/api/admin/cms-pages/[id]/route.ts` | Validate `parent_id` on update; on DELETE, promote children to root before deleting |
| `src/api/store/cms-pages/route.ts` | New query-based route (replaces `[slug]/route.ts`) |
| `src/api/store/cms-pages/preview/route.ts` | New query-based preview route (replaces `[slug]/preview/route.ts`) |
| `src/api/store/cms-pages/[slug]/route.ts` | Delete (replaced by query-based route) |
| `src/api/store/cms-pages/[slug]/preview/route.ts` | Delete (replaced by query-based preview route) |

### Admin UI (boutique)

| File | Action |
|---|---|
| `src/admin/routes/cms-pages/page.tsx` | Rewrite list as drag-and-drop tree |
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

### Storefront (boutique-storefront)

| File | Action |
|---|---|
| `src/app/[countryCode]/(main)/[...slug]/page.tsx` | New catchall route (replaces `page/[slug]`), handles both published and preview |
| `src/app/[countryCode]/(main)/[...slug]/gjs-renderer.tsx` | Move from `page/[slug]/` |
| `src/app/[countryCode]/(main)/[...slug]/products-grid-server.tsx` | Move from `page/[slug]/` |
| `src/app/[countryCode]/(main)/page/[slug]/` | Delete entire old route directory |
| `src/app/[countryCode]/(main)/page/[slug]/preview/` | Delete (preview now handled in catchall) |
| `src/lib/data/cms-pages.ts` | Update `getCmsPage`/`getCmsPagePreview` to use query-based API (`?slug=...`) |
| `next.config.js` | Add `/page/*` → `/*` permanent redirect |

---

## 6. Migration SQL

```sql
-- Up
ALTER TABLE IF EXISTS "cms_page"
  ADD COLUMN IF NOT EXISTS "parent_id" text NULL,
  ADD COLUMN IF NOT EXISTS "position" integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "cms_page_parent_slug_unique"
  ON "cms_page" (COALESCE(parent_id, '__root__'), slug);

-- Down
DROP INDEX IF EXISTS "cms_page_parent_slug_unique";

ALTER TABLE IF EXISTS "cms_page"
  DROP COLUMN IF EXISTS "parent_id",
  DROP COLUMN IF EXISTS "position";
```

After creating the migration, regenerate the snapshot: `npx medusa db:generate --modules cmsPage`

---

## 7. Out of Scope

- Multi-level nesting (depth > 1)
- Breadcrumb navigation on storefront
- Sitemap generation for nested pages
- Drag-and-drop between different layouts
- Bulk operations (move multiple pages at once)
