# CMS Page Drag-and-Drop Ordering & Nesting — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-and-drop reordering and parent/child nesting to CMS pages, with SEO-friendly hierarchical URLs on the storefront.

**Architecture:** Add `parent_id` and `position` columns to `cms_page` model. New `/admin/cms-pages/reorder` endpoint for batch updates. Admin list rewritten with `@dnd-kit` tree. Storefront switches from `/page/[slug]` to `[...slug]` catchall with query-based backend API.

**Tech Stack:** Medusa 2.13.1, MikroORM, `@dnd-kit/core` + `@dnd-kit/sortable`, Next.js 15 App Router, React 18, TanStack Query.

**Spec:** `docs/superpowers/specs/2026-03-11-cms-page-drag-drop-nesting-design.md`

**Sequencing:** Tasks MUST be completed in order. Chunks 1-2 (backend) must be fully done before Chunk 4 (storefront), because the storefront depends on the new query-based API. Chunk 3 (admin UI) can be done after Chunk 2 but is independent of Chunk 4.

---

## Chunk 1: Backend — Data Model & Migration

### Task 1: Add `parent_id` and `position` to CMS Page model

**Files:**
- Modify: `boutique/src/modules/cms-page/models/cms-page.ts`

- [ ] **Step 1: Update model definition**

```ts
import { model } from "@medusajs/framework/utils"

const CmsPage = model.define("cms_page", {
  id: model.id().primaryKey(),
  store_id: model.text().nullable(),
  slug: model.text().searchable(),
  status: model.enum(["draft", "published"]).default("draft"),
  title: model.text(),
  seo_meta_title: model.text().nullable(),
  seo_meta_description: model.text().nullable(),
  seo_og_image_url: model.text().nullable(),
  content: model.json().default({}),
  layout_id: model.text().nullable(),
  preview_token: model.text().nullable(),
  is_system: model.boolean().default(false),
  noindex: model.boolean().default(false),
  parent_id: model.text().nullable(),
  position: model.number().default(0),
})

export default CmsPage
```

- [ ] **Step 2: Create migration file**

Create: `boutique/src/modules/cms-page/migrations/Migration20260311160000.ts`

```ts
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260311160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "cms_page" ADD COLUMN IF NOT EXISTS "parent_id" text NULL, ADD COLUMN IF NOT EXISTS "position" integer NOT NULL DEFAULT 0;`)
    this.addSql(`CREATE UNIQUE INDEX "cms_page_parent_slug_unique" ON "cms_page" (COALESCE(parent_id, '__root__'), slug);`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "cms_page_parent_slug_unique";`)
    this.addSql(`ALTER TABLE IF EXISTS "cms_page" DROP COLUMN IF EXISTS "parent_id", DROP COLUMN IF EXISTS "position";`)
  }
}
```

- [ ] **Step 3: Regenerate snapshot and run migration**

Run:
```bash
cd boutique
npx medusa db:generate --modules cmsPage
npx medusa db:migrate
```

Expected: Migration runs successfully, snapshot updated.

- [ ] **Step 4: Commit**

```bash
git add boutique/src/modules/cms-page/models/cms-page.ts boutique/src/modules/cms-page/migrations/Migration20260311160000.ts boutique/src/modules/cms-page/migrations/.snapshot-cms-page.json
git commit -m "feat(cms): add parent_id and position columns to cms_page model"
```

---

## Chunk 2: Backend — API Endpoints

### Task 2: Update schemas and middleware

**Files:**
- Modify: `boutique/src/api/admin/cms-pages/middlewares.ts`

- [ ] **Step 1: Add parent_id, position to schemas and add reorder schema + middleware**

```ts
import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "zod"

export const CreateCmsPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  title: z.string().min(1).max(500),
  store_id: z.string().nullish(),
  seo_meta_title: z.string().max(200).nullish(),
  seo_meta_description: z.string().max(500).nullish(),
  seo_og_image_url: z.string().url().max(2000).nullish(),
  noindex: z.boolean().optional(),
  content: z.record(z.unknown()).optional(),
  layout_id: z.string().nullish(),
  parent_id: z.string().nullish(),
  position: z.number().int().min(0).optional(),
})

export type CreateCmsPageSchema = z.infer<typeof CreateCmsPageSchema>

export const UpdateCmsPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .optional(),
  title: z.string().min(1).max(500).optional(),
  store_id: z.string().nullish(),
  seo_meta_title: z.string().max(200).nullish(),
  seo_meta_description: z.string().max(500).nullish(),
  seo_og_image_url: z.string().url().max(2000).nullish(),
  noindex: z.boolean().optional(),
  content: z.record(z.unknown()).optional(),
  layout_id: z.string().nullish(),
  parent_id: z.string().nullish(),
  position: z.number().int().min(0).optional(),
})

export type UpdateCmsPageSchema = z.infer<typeof UpdateCmsPageSchema>

export const ReorderCmsPagesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      parent_id: z.string().nullable(),
      position: z.number().int().min(0),
    })
  ),
})

export type ReorderCmsPagesSchema = z.infer<typeof ReorderCmsPagesSchema>

export const FigmaImportSchema = z.object({
  figma_url: z.string().url().min(1),
})

export type FigmaImportSchema = z.infer<typeof FigmaImportSchema>

export const adminCmsPagesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/cms-pages/figma-import",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(FigmaImportSchema),
    ],
  },
  // IMPORTANT: reorder must be before :id to avoid matching "reorder" as an id
  {
    matcher: "/admin/cms-pages/reorder",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(ReorderCmsPagesSchema),
    ],
  },
  {
    matcher: "/admin/cms-pages",
    method: "GET",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(CreateCmsPageSchema),
    ],
  },
  {
    matcher: "/admin/cms-pages/:id",
    method: "GET",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages/:id",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(UpdateCmsPageSchema),
    ],
  },
  {
    matcher: "/admin/cms-pages/:id",
    method: "DELETE",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages/:id/publish",
    method: "POST",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages/:id/unpublish",
    method: "POST",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add boutique/src/api/admin/cms-pages/middlewares.ts
git commit -m "feat(cms): add parent_id, position to schemas and reorder middleware"
```

---

### Task 3: Update GET /admin/cms-pages (list with children_count) and extend reserved slugs

**Files:**
- Modify: `boutique/src/api/admin/cms-pages/route.ts`

- [ ] **Step 1: Update GET handler and RESERVED_SLUGS**

```ts
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CMS_PAGE_MODULE } from "../../../modules/cms-page"
import CmsPageModuleService from "../../../modules/cms-page/service"
import createCmsPageWorkflow from "../../../workflows/create-cms-page"
import type { CreateCmsPageSchema } from "./middlewares"

// Reserved slugs that cannot be used for new pages
const RESERVED_SLUGS = ["/", "home", "homepage", "accueil", "account", "cart", "categories", "collections", "order", "page", "preview", "products", "store"]

// GET /admin/cms-pages — list all pages
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const filters: Record<string, unknown> = {}
  const storeId = req.query.store_id
  if (storeId && typeof storeId === "string") {
    filters.store_id = storeId
  }

  const [pages, count] = await cmsPageService.listAndCountCmsPages(filters, {
    order: { position: "ASC" },
  })

  // Compute children_count in JS (O(n), no extra DB queries)
  const pagesWithCount = pages.map((page: any) => ({
    ...page,
    children_count: pages.filter((p: any) => p.parent_id === page.id).length,
  }))

  res.json({ pages: pagesWithCount, count })
}

// POST /admin/cms-pages — create a new draft page
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateCmsPageSchema>,
  res: MedusaResponse
) => {
  const slug = req.validatedBody.slug?.toLowerCase()

  // Prevent creating pages with reserved slugs
  if (slug && RESERVED_SLUGS.includes(slug)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `The slug "${req.validatedBody.slug}" is reserved. Please choose a different slug.`
    )
  }

  // Validate parent_id constraints
  if (req.validatedBody.parent_id) {
    const cmsPageService: CmsPageModuleService =
      req.scope.resolve(CMS_PAGE_MODULE)

    const parent = await cmsPageService.retrieveCmsPage(req.validatedBody.parent_id)

    if (parent.parent_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot nest a page under a sub-page (max depth = 1)"
      )
    }

    if (parent.is_system) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot nest a page under the homepage"
      )
    }
  }

  // Auto-assign position if not provided
  if (req.validatedBody.position === undefined) {
    const cmsPageService: CmsPageModuleService =
      req.scope.resolve(CMS_PAGE_MODULE)

    const parentId = req.validatedBody.parent_id || null
    const [siblings] = await cmsPageService.listAndCountCmsPages(
      parentId ? { parent_id: parentId } : { parent_id: null },
      { order: { position: "DESC" }, take: 1 }
    )

    req.validatedBody.position = siblings.length > 0 ? (siblings[0] as any).position + 1 : 0
  }

  const { result: page } = await createCmsPageWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ page })
}
```

- [ ] **Step 2: Also update RESERVED_SLUGS in [id]/route.ts**

In `boutique/src/api/admin/cms-pages/[id]/route.ts`, update line 13:

```ts
const RESERVED_SLUGS = ["/", "home", "homepage", "accueil", "account", "cart", "categories", "collections", "order", "page", "preview", "products", "store"]
```

- [ ] **Step 3: Commit**

```bash
git add boutique/src/api/admin/cms-pages/route.ts boutique/src/api/admin/cms-pages/[id]/route.ts
git commit -m "feat(cms): update page list with children_count, extend reserved slugs"
```

---

### Task 4: Update [id] route — parent_id validation on update, child promotion on delete

**Files:**
- Modify: `boutique/src/api/admin/cms-pages/[id]/route.ts`

- [ ] **Step 1: Add parent_id validation to POST and child promotion to DELETE**

Replace the full file:

```ts
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"
import updateCmsPageWorkflow from "../../../../workflows/update-cms-page"
import deleteCmsPageWorkflow from "../../../../workflows/delete-cms-page"
import type { UpdateCmsPageSchema } from "../middlewares"

// Reserved slugs that cannot be used (except by system pages)
const RESERVED_SLUGS = ["/", "home", "homepage", "accueil", "account", "cart", "categories", "collections", "order", "page", "preview", "products", "store"]

// GET /admin/cms-pages/:id
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const page = await cmsPageService.retrieveCmsPage(req.params.id)

  res.json({ page })
}

// POST /admin/cms-pages/:id — update page
export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateCmsPageSchema>,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const existingPage = await cmsPageService.retrieveCmsPage(req.params.id)

  // Prevent changing slug of system pages (homepage)
  if (existingPage.is_system && req.validatedBody.slug && req.validatedBody.slug !== "/") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot change the slug of the homepage"
    )
  }

  // Prevent using reserved slugs (for non-system pages)
  const newSlug = req.validatedBody.slug?.toLowerCase()
  if (!existingPage.is_system && newSlug && RESERVED_SLUGS.includes(newSlug)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `The slug "${req.validatedBody.slug}" is reserved. Please choose a different slug.`
    )
  }

  // Validate parent_id constraints
  if (req.validatedBody.parent_id !== undefined) {
    // System pages cannot become sub-pages
    if (existingPage.is_system && req.validatedBody.parent_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot make the homepage a sub-page"
      )
    }

    if (req.validatedBody.parent_id) {
      // Cannot reference self
      if (req.validatedBody.parent_id === req.params.id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "A page cannot be its own parent"
        )
      }

      // Check if this page has children — if so, it cannot become a sub-page
      const [children] = await cmsPageService.listAndCountCmsPages({
        parent_id: req.params.id,
      })
      if (children.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot make a parent page into a sub-page. Remove its children first."
        )
      }

      // Parent must exist, be root-level, and not be a system page
      const parent = await cmsPageService.retrieveCmsPage(req.validatedBody.parent_id)

      if (parent.parent_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest a page under a sub-page (max depth = 1)"
        )
      }

      if (parent.is_system) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest a page under the homepage"
        )
      }
    }
  }

  const { result: page } = await updateCmsPageWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.json({ page })
}

// DELETE /admin/cms-pages/:id
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const page = await cmsPageService.retrieveCmsPage(req.params.id)

  // Prevent deletion of system pages (homepage)
  if (page.is_system) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot delete system pages (homepage)"
    )
  }

  // Promote children to root level before deleting
  const [children] = await cmsPageService.listAndCountCmsPages({
    parent_id: req.params.id,
  })

  if (children.length > 0) {
    // Get max position of root pages to append promoted children at the end
    const [rootPages] = await cmsPageService.listAndCountCmsPages(
      { parent_id: null },
      { order: { position: "DESC" }, take: 1 }
    )
    let nextPosition = rootPages.length > 0 ? (rootPages[0] as any).position + 1 : 0

    for (const child of children) {
      await cmsPageService.updateCmsPages({
        id: child.id,
        parent_id: null,
        position: nextPosition++,
      })
    }
  }

  await deleteCmsPageWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json({ id: req.params.id, deleted: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add boutique/src/api/admin/cms-pages/[id]/route.ts
git commit -m "feat(cms): add parent_id validation on update, promote children on delete"
```

---

### Task 5: Create reorder endpoint

**Files:**
- Create: `boutique/src/api/admin/cms-pages/reorder/route.ts`

- [ ] **Step 1: Create the reorder route file**

```ts
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"
import type { ReorderCmsPagesSchema } from "../middlewares"

// POST /admin/cms-pages/reorder — batch update positions and parents
export const POST = async (
  req: AuthenticatedMedusaRequest<ReorderCmsPagesSchema>,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const { items } = req.validatedBody

  // Fetch all referenced pages in one query
  const ids = items.map((item) => item.id)
  const [existingPages] = await cmsPageService.listAndCountCmsPages({
    id: ids,
  })

  const pageMap = new Map(existingPages.map((p: any) => [p.id, p]))

  // Validate all items
  for (const item of items) {
    const page = pageMap.get(item.id)
    if (!page) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Page "${item.id}" not found`
      )
    }

    // System pages cannot have a parent
    if ((page as any).is_system && item.parent_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot make the homepage a sub-page"
      )
    }

    if (item.parent_id) {
      // Cannot be own parent
      if (item.parent_id === item.id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Page "${item.id}" cannot be its own parent`
        )
      }

      // Parent must be in the items list or exist in DB, and must be root-level
      const parentInItems = items.find((i) => i.id === item.parent_id)
      if (parentInItems && parentInItems.parent_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest more than 1 level deep"
        )
      }

      const parentPage = pageMap.get(item.parent_id)
      if (!parentPage && !parentInItems) {
        // Parent not in the batch — check DB
        try {
          const dbParent = await cmsPageService.retrieveCmsPage(item.parent_id)
          if ((dbParent as any).parent_id) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Cannot nest under a sub-page"
            )
          }
          if ((dbParent as any).is_system) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Cannot nest under the homepage"
            )
          }
        } catch (e: any) {
          if (e.type === "not_found") {
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              `Parent page "${item.parent_id}" not found`
            )
          }
          throw e
        }
      }

      if (parentPage && (parentPage as any).is_system) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest under the homepage"
        )
      }
    }
  }

  // Apply all updates
  for (const item of items) {
    await cmsPageService.updateCmsPages({
      id: item.id,
      parent_id: item.parent_id,
      position: item.position,
    })
  }

  res.json({ success: true })
}
```

- [ ] **Step 2: Verify the endpoint works**

Run: `npx medusa develop` and test with curl:

```bash
curl -X POST http://localhost:9000/admin/cms-pages/reorder \
  -H "Content-Type: application/json" \
  -H "Cookie: <session>" \
  -d '{"items":[]}'
```

Expected: `{ "success": true }`

- [ ] **Step 3: Commit**

```bash
git add boutique/src/api/admin/cms-pages/reorder/route.ts
git commit -m "feat(cms): add batch reorder endpoint for drag-and-drop"
```

---

### Task 6: Update workflow types to include parent_id and position

**Files:**
- Modify: `boutique/src/workflows/create-cms-page.ts`
- Modify: `boutique/src/workflows/update-cms-page.ts`
- Modify: `boutique/src/workflows/steps/create-cms-page.ts`
- Modify: `boutique/src/workflows/steps/update-cms-page.ts`

- [ ] **Step 1: Update create workflow input type**

In `boutique/src/workflows/create-cms-page.ts`, add these two fields to the **existing** `CreateCmsPageWorkflowInput` type (keep all existing fields unchanged):

```ts
  parent_id?: string | null
  position?: number
```

- [ ] **Step 2: Update create step input type**

In `boutique/src/workflows/steps/create-cms-page.ts`, add these two fields to the **existing** `CreateCmsPageStepInput` type (keep all existing fields unchanged):

```ts
  parent_id?: string | null
  position?: number
```

Also update the slug uniqueness check to account for `parent_id` — change the `listCmsPages` filter at line 22-25:

```ts
    // Check slug uniqueness within the same parent
    const [existing] = await cmsPageService.listCmsPages({
      slug: input.slug,
      parent_id: input.parent_id || null,
      ...(input.store_id ? { store_id: input.store_id } : {}),
    })
```

- [ ] **Step 3: Update update workflow input type**

In `boutique/src/workflows/update-cms-page.ts`, add these two fields to the **existing** `UpdateCmsPageWorkflowInput` type (keep all existing fields unchanged):

```ts
  parent_id?: string | null
  position?: number
```

- [ ] **Step 4: Update update step input type and slug check**

In `boutique/src/workflows/steps/update-cms-page.ts`, add these two fields to the **existing** `UpdateCmsPageStepInput` type (keep all existing fields unchanged):

```ts
  parent_id?: string | null
  position?: number
```

Update the slug uniqueness check (line 27-30) to account for parent_id:

```ts
    if (input.slug && input.slug !== existing.slug) {
      const targetParentId = input.parent_id !== undefined ? input.parent_id : existing.parent_id
      const [conflict] = await cmsPageService.listCmsPages({
        slug: input.slug,
        parent_id: targetParentId || null,
        ...(existing.store_id ? { store_id: existing.store_id } : {}),
      })

      if (conflict) {
        throw new Error(`A page with slug "${input.slug}" already exists under this parent.`)
      }
    }
```

Also update the rollback data to include `parent_id` and `position`:

```ts
    return new StepResponse(updated, {
      id: existing.id,
      slug: existing.slug,
      title: existing.title,
      seo_meta_title: existing.seo_meta_title,
      seo_meta_description: existing.seo_meta_description,
      seo_og_image_url: existing.seo_og_image_url,
      content: existing.content,
      parent_id: existing.parent_id,
      position: existing.position,
    })
```

- [ ] **Step 5: Commit**

```bash
git add boutique/src/workflows/create-cms-page.ts boutique/src/workflows/update-cms-page.ts boutique/src/workflows/steps/create-cms-page.ts boutique/src/workflows/steps/update-cms-page.ts
git commit -m "feat(cms): add parent_id and position to workflow types"
```

---

### Task 7: Update store API — query-based slug resolution

**Files:**
- Create: `boutique/src/api/store/cms-pages/route.ts`
- Create: `boutique/src/api/store/cms-pages/preview/route.ts`
- Delete: `boutique/src/api/store/cms-pages/[slug]/route.ts`
- Delete: `boutique/src/api/store/cms-pages/[slug]/preview/route.ts`

- [ ] **Step 1: Create the new query-based store route**

Create `boutique/src/api/store/cms-pages/route.ts`:

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../modules/cms-page"
import CmsPageModuleService from "../../../modules/cms-page/service"

// GET /store/cms-pages?slug=xxx — get published page by slug (supports composite slugs)
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const slug = req.query.slug

  if (!slug || typeof slug !== "string") {
    res.status(400).json({ message: "slug query parameter is required" })
    return
  }

  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const segments = slug.split("/").filter(Boolean)

  if (segments.length === 0 || segments.length > 2) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  let page: any = null

  if (segments.length === 1) {
    // Root page lookup
    const [pages] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
      status: "published",
    })
    page = pages[0]
  } else {
    // Sub-page: find parent first, then child
    const [parents] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
      status: "published",
    })
    const parent = parents[0]

    if (parent) {
      const [children] = await cmsPageService.listAndCountCmsPages({
        slug: segments[1],
        parent_id: parent.id,
        status: "published",
      })
      page = children[0]
    }
  }

  if (!page) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  // Fetch the page's assigned layout (if any)
  let layout = null
  if (page.layout_id) {
    try {
      layout = await cmsPageService.retrieveCmsLayout(page.layout_id)
    } catch {
      // Layout may have been deleted — continue without it
    }
  }

  // Don't expose preview_token to the public
  const { preview_token, ...publicPage } = page

  res.json({
    page: publicPage,
    layout: layout
      ? { id: layout.id, html: layout.html, css: layout.css, content_position: layout.content_position }
      : null,
  })
}
```

- [ ] **Step 2: Create the new query-based preview route**

Create `boutique/src/api/store/cms-pages/preview/route.ts`:

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"

// GET /store/cms-pages/preview?slug=xxx&token=xxx — get page draft for preview
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const slug = req.query.slug
  const token = req.query.token

  if (!slug || typeof slug !== "string") {
    res.status(400).json({ message: "slug query parameter is required" })
    return
  }

  if (!token || typeof token !== "string") {
    res.status(401).json({ message: "Preview token required" })
    return
  }

  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const segments = slug.split("/").filter(Boolean)

  if (segments.length === 0 || segments.length > 2) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  let page: any = null

  if (segments.length === 1) {
    const [pages] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
      preview_token: token,
    })
    page = pages[0]
  } else {
    // For sub-page preview: find parent (by slug, any status), then child with token
    const [parents] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
    })
    const parent = parents[0]

    if (parent) {
      const [children] = await cmsPageService.listAndCountCmsPages({
        slug: segments[1],
        parent_id: parent.id,
        preview_token: token,
      })
      page = children[0]
    }
  }

  if (!page) {
    res.status(401).json({ message: "Invalid preview token or page not found" })
    return
  }

  // Fetch the page's assigned layout (if any)
  let layout = null
  if (page.layout_id) {
    try {
      layout = await cmsPageService.retrieveCmsLayout(page.layout_id)
    } catch {
      // Layout may have been deleted
    }
  }

  // Don't expose preview_token
  const { preview_token: _pt, ...previewPage } = page

  res.json({
    page: previewPage,
    layout: layout
      ? { id: layout.id, html: layout.html, css: layout.css, content_position: layout.content_position }
      : null,
  })
}
```

- [ ] **Step 3: Delete old path-based routes**

```bash
rm -rf boutique/src/api/store/cms-pages/\[slug\]
```

- [ ] **Step 4: Verify the Medusa server starts**

Run: `cd boutique && npx medusa develop`

Expected: No errors on startup.

- [ ] **Step 5: Commit**

```bash
git add boutique/src/api/store/cms-pages/route.ts boutique/src/api/store/cms-pages/preview/route.ts
git rm -r boutique/src/api/store/cms-pages/\[slug\]
git commit -m "feat(cms): switch store API to query-based slug resolution for composite slugs"
```

---

## Chunk 3: Admin UI — Drag-and-Drop Tree

### Task 8: Install @dnd-kit dependencies

**Files:**
- Modify: `boutique/package.json`

- [ ] **Step 1: Install packages**

```bash
cd boutique && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Commit**

```bash
git add boutique/package.json boutique/package-lock.json
git commit -m "chore: add @dnd-kit dependencies for drag-and-drop"
```

---

### Task 9: Rewrite CMS pages list with drag-and-drop tree

**Files:**
- Modify: `boutique/src/admin/routes/cms-pages/page.tsx`

This is the largest task. The page is rewritten to display a tree with drag-and-drop, expand/collapse, and the ability to nest pages.

- [ ] **Step 1: Rewrite the full page component**

Replace the entire contents of `boutique/src/admin/routes/cms-pages/page.tsx`:

```tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Container, Heading, Text, Button, Label, Input, Switch, toast } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useState, useCallback, useRef, useMemo } from "react"
import { sdk } from "../../lib/client"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// --- Types ---

type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  noindex: boolean
  updated_at: string
  is_system: boolean
  parent_id: string | null
  position: number
  children_count: number
}

type TreeNode = CmsPage & { children: CmsPage[] }

// --- Helpers ---

function buildTree(pages: CmsPage[]): TreeNode[] {
  const rootPages = pages
    .filter((p) => !p.parent_id)
    .sort((a, b) => a.position - b.position)

  return rootPages.map((root) => ({
    ...root,
    children: pages
      .filter((p) => p.parent_id === root.id)
      .sort((a, b) => a.position - b.position),
  }))
}

function flattenTreeForReorder(tree: TreeNode[]): Array<{ id: string; parent_id: string | null; position: number }> {
  const items: Array<{ id: string; parent_id: string | null; position: number }> = []
  tree.forEach((node, i) => {
    items.push({ id: node.id, parent_id: null, position: i })
    node.children.forEach((child, j) => {
      items.push({ id: child.id, parent_id: node.id, position: j })
    })
  })
  return items
}

// --- Edit Modal (unchanged from before) ---

const EditPageModal = ({
  page,
  onClose,
}: {
  page: CmsPage
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState(page.slug)
  const [title, setTitle] = useState(page.title)
  const [seoTitle, setSeoTitle] = useState(page.seo_meta_title || "")
  const [seoDescription, setSeoDescription] = useState(page.seo_meta_description || "")
  const [noindex, setNoindex] = useState(page.noindex ?? false)

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${page.id}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      ...(page.is_system ? {} : { slug }),
      title,
      seo_meta_title: seoTitle || null,
      seo_meta_description: seoDescription || null,
      noindex,
    })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: "var(--bg-base, #fff)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-base, #e5e7eb)",
            }}
          >
            <Heading level="h2">Modifier la page</Heading>
          </div>

          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <Label size="small">Titre</Label>
              <Input
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {!page.is_system && (
              <div>
                <Label size="small">Slug</Label>
                <Input
                  size="small"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  required
                />
                <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                  URL : /{slug}
                </Text>
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid var(--border-base, #e5e7eb)",
                paddingTop: 16,
              }}
            >
              <Text size="small" weight="plus" className="mb-3">
                SEO
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <Label size="small">Balise Title</Label>
                  <Input
                    size="small"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Titre pour les moteurs de recherche"
                  />
                  <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                    {seoTitle.length}/60 caracteres
                  </Text>
                </div>
                <div>
                  <Label size="small">Meta Description</Label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Description pour les moteurs de recherche"
                    rows={3}
                    className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm resize-none"
                  />
                  <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                    {seoDescription.length}/160 caracteres
                  </Text>
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
                <div>
                  <Label size="small">Ne pas indexer cette page</Label>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Ajoute la balise noindex pour les moteurs de recherche
                  </Text>
                </div>
                <Switch size="small" checked={noindex} onCheckedChange={setNoindex} />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-base, #e5e7eb)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button size="small" variant="secondary" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button
              size="small"
              type="submit"
              isLoading={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Enregistrer
            </Button>
          </div>

          {updateMutation.isError && (
            <div style={{ padding: "0 24px 16px" }}>
              <Text size="small" className="text-ui-fg-error">
                {(updateMutation.error as Error).message}
              </Text>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// --- Sortable Row ---

const SortableRow = ({
  page,
  isChild,
  isExpanded,
  hasChildren,
  isNestTarget,
  onToggleExpand,
  onEdit,
  onDelete,
  onNavigate,
}: {
  page: CmsPage
  isChild: boolean
  isExpanded?: boolean
  hasChildren?: boolean
  isNestTarget?: boolean
  onToggleExpand?: () => void
  onEdit: () => void
  onDelete: () => void
  onNavigate: () => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: page.is_system,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: isChild ? 48 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-6 py-3 hover:bg-ui-bg-base-hover ${
        isChild ? "border-l-2 border-ui-border-base ml-6" : ""
      } ${isNestTarget ? "bg-blue-50 ring-2 ring-blue-300 ring-inset" : ""}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Grip handle */}
        {!page.is_system && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-ui-fg-muted hover:text-ui-fg-base p-1"
            style={{ touchAction: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
        )}

        {/* Expand/collapse chevron for parents */}
        {!isChild && hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand?.()
            }}
            className="text-ui-fg-muted hover:text-ui-fg-base p-1"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            >
              <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : !isChild ? (
          <div style={{ width: 28 }} />
        ) : null}

        {/* Page info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
          <Text size="small" weight="plus" className="truncate">
            {page.title}
            {page.is_system && (
              <span className="ml-2 text-xs text-ui-fg-muted">(Homepage)</span>
            )}
          </Text>
          <Text size="xsmall" className="text-ui-fg-subtle truncate">
            {page.is_system ? "/" : isChild ? page.slug : `/${page.slug}`}
          </Text>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            page.status === "published"
              ? "bg-ui-tag-green-bg text-ui-tag-green-text"
              : "bg-ui-tag-orange-bg text-ui-tag-orange-text"
          }`}
        >
          {page.status}
        </span>
        <Button
          size="small"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          Edit
        </Button>
        {!page.is_system && (
          <Button
            size="small"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}

// --- Main Component ---

const CmsPagesList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overParentId, setOverParentId] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const { data, isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: () =>
      sdk.client.fetch<{ pages: CmsPage[]; count: number }>(
        "/admin/cms-pages"
      ),
  })

  const createMutation = useMutation({
    mutationFn: (body: { slug: string; title: string; content: Record<string, unknown> }) =>
      sdk.client.fetch<{ page: CmsPage }>("/admin/cms-pages", {
        method: "POST",
        body,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      setShowCreate(false)
      setNewSlug("")
      setNewTitle("")
      navigate(`/cms-pages/${result.page.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/cms-pages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: Array<{ id: string; parent_id: string | null; position: number }>) =>
      sdk.client.fetch("/admin/cms-pages/reorder", {
        method: "POST",
        body: { items },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      toast.success("Ordre sauvegarde")
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      toast.error("Erreur lors de la sauvegarde")
    },
  })

  const pages = data?.pages ?? []
  const tree = useMemo(() => buildTree(pages), [pages])

  // Flat list of IDs for DnD context (root pages + expanded children)
  const sortableIds = useMemo(() => {
    const ids: string[] = []
    for (const node of tree) {
      if (node.is_system) continue // System pages at the bottom, not draggable
      ids.push(node.id)
      if (expandedIds.has(node.id)) {
        node.children.forEach((c) => ids.push(c.id))
      }
    }
    return ids
  }, [tree, expandedIds])

  const pageMap = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      slug: newSlug,
      title: newTitle,
      content: { content: [], root: { props: {} } },
    })
  }

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
        setOverParentId(null)
        return
      }

      const overId = over.id as string
      const activePageData = pageMap.get(active.id as string)
      const overPageData = pageMap.get(overId)

      // Clear previous hover timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }

      // Determine if we should highlight as "nest target"
      // A root page (not system, not self, not already a child) can be a nest target
      const canNest =
        overPageData &&
        !overPageData.parent_id &&
        !overPageData.is_system &&
        overId !== (active.id as string) &&
        activePageData &&
        !activePageData.is_system

      if (canNest) {
        // After 300ms of hovering over a root page, mark it as nest target
        hoverTimerRef.current = setTimeout(() => {
          setOverParentId(overId)
          // Also auto-expand if collapsed
          if (!expandedIds.has(overId)) {
            setExpandedIds((prev) => new Set(prev).add(overId))
          }
        }, 300)
      } else {
        setOverParentId(null)
      }
    },
    [pageMap, expandedIds]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const nestTargetId = overParentId // capture before clearing
      setActiveId(null)
      setOverParentId(null)

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }

      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeId = active.id as string
      const overId = over.id as string

      const activePage = pageMap.get(activeId)
      const overPage = pageMap.get(overId)

      if (!activePage || !overPage || activePage.is_system) return

      // Build a mutable copy of the tree
      const newTree = tree.map((node) => ({
        ...node,
        children: [...node.children],
      }))

      // Remove active page from current position in the tree
      const removeFromTree = (id: string) => {
        const rootIdx = newTree.findIndex((n) => n.id === id)
        if (rootIdx !== -1) {
          return newTree.splice(rootIdx, 1)[0]
        }
        for (const node of newTree) {
          const childIdx = node.children.findIndex((c) => c.id === id)
          if (childIdx !== -1) {
            return node.children.splice(childIdx, 1)[0]
          }
        }
        return null
      }

      const removed = removeFromTree(activeId)
      if (!removed) return

      // CASE 1: Nesting — overParentId is set (user hovered 300ms+ on a root page)
      if (nestTargetId) {
        const targetNode = newTree.find((n) => n.id === nestTargetId)
        if (targetNode) {
          // Add as last child of the target parent
          targetNode.children.push({
            ...removed,
            parent_id: nestTargetId,
            children_count: 0,
          } as CmsPage)

          const items = flattenTreeForReorder(newTree)
          reorderMutation.mutate(items)
          return
        }
      }

      // CASE 2: Dropping near a child — insert as sibling in that parent
      const overParent = newTree.find((n) =>
        n.children.some((c) => c.id === overId)
      )

      if (overParent) {
        const overIdx = overParent.children.findIndex((c) => c.id === overId)
        overParent.children.splice(overIdx, 0, {
          ...removed,
          parent_id: overParent.id,
          children_count: 0,
        } as CmsPage)
      } else {
        // CASE 3: Dropping at root level — reorder among root pages
        const overRootIdx = newTree.findIndex((n) => n.id === overId)
        if (overRootIdx !== -1) {
          const removedAsTree: TreeNode = {
            ...removed,
            parent_id: null,
            children: (removed as TreeNode).children || [],
          }
          newTree.splice(overRootIdx, 0, removedAsTree)
        }
      }

      const items = flattenTreeForReorder(newTree)
      reorderMutation.mutate(items)
    },
    [tree, pageMap, reorderMutation, overParentId]
  )

  // System pages always shown at the bottom
  const systemPages = pages.filter((p) => p.is_system)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">CMS Pages</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Drag to reorder. Drop on a page to nest as sub-page.
          </Text>
        </div>
        <Button size="small" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Page"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="px-6 py-4 bg-ui-bg-subtle">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Text size="small" weight="plus" className="mb-1">
                Slug
              </Text>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="about-us"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <Text size="small" weight="plus" className="mb-1">
                Title
              </Text>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="About Us"
                required
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm"
              />
            </div>
            <Button
              size="small"
              type="submit"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Create
            </Button>
          </div>
          {createMutation.isError && (
            <Text size="small" className="text-ui-fg-error mt-2">
              {(createMutation.error as Error).message}
            </Text>
          )}
        </form>
      )}

      {isLoading ? (
        <div className="px-6 py-8 text-center">
          <Text size="small" className="text-ui-fg-subtle">
            Loading pages...
          </Text>
        </div>
      ) : pages.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text size="small" className="text-ui-fg-subtle">
            No pages yet. Create your first page.
          </Text>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="divide-y">
              {tree
                .filter((node) => !node.is_system)
                .map((node) => (
                  <div key={node.id}>
                    <SortableRow
                      page={node}
                      isChild={false}
                      isExpanded={expandedIds.has(node.id)}
                      hasChildren={node.children.length > 0}
                      isNestTarget={overParentId === node.id}
                      onToggleExpand={() => toggleExpand(node.id)}
                      onEdit={() => setEditingPage(node)}
                      onDelete={() => {
                        if (confirm("Delete this page?")) {
                          deleteMutation.mutate(node.id)
                        }
                      }}
                      onNavigate={() => navigate(`/cms-pages/${node.id}`)}
                    />
                    {expandedIds.has(node.id) &&
                      node.children.map((child) => (
                        <SortableRow
                          key={child.id}
                          page={child}
                          isChild={true}
                          onEdit={() => setEditingPage(child)}
                          onDelete={() => {
                            if (confirm("Delete this page?")) {
                              deleteMutation.mutate(child.id)
                            }
                          }}
                          onNavigate={() => navigate(`/cms-pages/${child.id}`)}
                        />
                      ))}
                  </div>
                ))}

              {/* System pages at the bottom (not draggable) */}
              {systemPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-ui-bg-base-hover cursor-pointer"
                  onClick={() => navigate(`/cms-pages/${page.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div style={{ width: 28 }} />
                    <div>
                      <Text size="small" weight="plus">
                        {page.title}
                        <span className="ml-2 text-xs text-ui-fg-muted">(Homepage)</span>
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">/</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ui-tag-green-bg text-ui-tag-green-text">
                      {page.status}
                    </span>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingPage(page)
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId && pageMap.get(activeId) ? (
              <div className="bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg px-6 py-3 opacity-90">
                <Text size="small" weight="plus">
                  {pageMap.get(activeId)!.title}
                </Text>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {editingPage && (
        <EditPageModal
          page={editingPage}
          onClose={() => setEditingPage(null)}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "CMS Pages",
  icon: DocumentText,
})

export default CmsPagesList
```

- [ ] **Step 2: Verify it renders**

Run `npx medusa develop`, navigate to CMS Pages in the admin panel. Verify:
- Pages appear in position order
- Grip handles are visible
- Expand/collapse works for pages with children
- System page is at the bottom without grip handle

- [ ] **Step 3: Test drag-and-drop**

- Drag a root page to reorder it
- Drop a page onto another to make it a sub-page
- Drag a sub-page between root pages to promote it

- [ ] **Step 4: Commit**

```bash
git add boutique/src/admin/routes/cms-pages/page.tsx
git commit -m "feat(cms): rewrite pages list with drag-and-drop tree using @dnd-kit"
```

---

### Task 10: Update admin preview URLs to remove /page/ prefix and handle sub-page slugs

**Files:**
- Modify: `boutique/src/admin/lib/grapes/editor/EditorToolbar.tsx`
- Modify: `boutique/src/admin/routes/cms-pages/[id]/page.tsx`

**Context:** The `page.slug` field stores only the page's own segment (e.g., `equipe`), not the full composite path. For sub-pages, we need to resolve the parent's slug to construct the correct URL. The editor page (`[id]/page.tsx`) already fetches the page data — it needs to also fetch the parent slug when `page.parent_id` is set, and pass it down.

- [ ] **Step 1: Pass `parentSlug` to EditorToolbar**

In `boutique/src/admin/routes/cms-pages/[id]/page.tsx`, after the page is loaded, fetch the parent page if `parent_id` is set:

```ts
// After page data is loaded, resolve parent slug for preview URL
const [parentSlug, setParentSlug] = useState<string | null>(null)

useEffect(() => {
  if (page?.parent_id) {
    sdk.client.fetch<{ page: { slug: string } }>(`/admin/cms-pages/${page.parent_id}`)
      .then((result) => setParentSlug(result.page.slug))
      .catch(() => setParentSlug(null))
  } else {
    setParentSlug(null)
  }
}, [page?.parent_id])
```

Then pass `parentSlug` as a prop to `EditorToolbar`.

- [ ] **Step 2: Update EditorToolbar types and preview URL**

Add `parentSlug` to `EditorToolbarProps` in `boutique/src/admin/lib/grapes/types.ts`:

```ts
export type EditorToolbarProps = {
  // ... existing props ...
  parentSlug: string | null
}
```

In `boutique/src/admin/lib/grapes/editor/EditorToolbar.tsx`, use `parentSlug` to build the full path:

```ts
const openPreview = useCallback(() => {
  const fullSlug = page.slug === "/"
    ? ""
    : parentSlug
      ? `/${parentSlug}/${page.slug}`
      : `/${page.slug}`

  const previewUrl = page.preview_token
    ? `${storeFrontUrl}${fullSlug}?token=${page.preview_token}`
    : `${storeFrontUrl}${fullSlug}`
  window.open(previewUrl, "_blank")
}, [page, storeFrontUrl, parentSlug])
```

Also update the URL display text (around line 205):

```tsx
{page.slug === "/"
  ? "/"
  : parentSlug
    ? `/${parentSlug}/${page.slug}`
    : `/${page.slug}`}
```

- [ ] **Step 3: Update url-redirects page if it references /page/**

In `boutique/src/admin/routes/url-redirects/page.tsx` line 232, update the subtitle:

Change: `` subtitle={`/page/${p.slug}`} ``
To: `` subtitle={`/${p.slug}`} ``

- [ ] **Step 4: Commit**

```bash
git add boutique/src/admin/lib/grapes/editor/EditorToolbar.tsx boutique/src/admin/lib/grapes/types.ts boutique/src/admin/routes/cms-pages/[id]/page.tsx
git commit -m "feat(cms): update admin preview URLs for composite slugs, remove /page/ prefix"
```

---

## Chunk 4: Storefront — Catchall Route & Data Layer

### Task 11: Update storefront data layer for query-based API

**Files:**
- Modify: `boutique-storefront/src/lib/data/cms-pages.ts`

- [ ] **Step 1: Update getCmsPage and getCmsPagePreview to use query params**

Change `getCmsPage`:

```ts
export async function getCmsPage(slug: string): Promise<CmsPageWithLayout | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/cms-pages?slug=${encodeURIComponent(slug)}`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      next: { revalidate: 60, tags: [`cms-page-${slug}`] },
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data.page) return null
    return { page: data.page, layout: data.layout ?? null }
  } catch {
    return null
  }
}
```

Change `getCmsPagePreview`:

```ts
export async function getCmsPagePreview(
  slug: string,
  token: string
): Promise<CmsPageWithLayout | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/cms-pages/preview?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`,
      {
        headers: {
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        cache: "no-store",
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    if (!data.page) return null
    return { page: data.page, layout: data.layout ?? null }
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add boutique-storefront/src/lib/data/cms-pages.ts
git commit -m "feat(cms): update storefront data layer for query-based slug API"
```

---

### Task 12: Create catchall route and delete old routes

**Files:**
- Create: `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx`
- Create: `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/gjs-renderer.tsx`
- Create: `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/products-grid-server.tsx`
- Delete: `boutique-storefront/src/app/[countryCode]/(main)/page/[slug]/` (entire directory)

- [ ] **Step 1: Move gjs-renderer.tsx**

Copy `boutique-storefront/src/app/[countryCode]/(main)/page/[slug]/gjs-renderer.tsx` to `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/gjs-renderer.tsx`. Contents are identical.

- [ ] **Step 2: Move products-grid-server.tsx**

Copy `boutique-storefront/src/app/[countryCode]/(main)/page/[slug]/products-grid-server.tsx` to `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/products-grid-server.tsx`. Contents are identical.

- [ ] **Step 3: Create the catchall page.tsx**

Create `boutique-storefront/src/app/[countryCode]/(main)/[...slug]/page.tsx`:

The key changes from the old `page/[slug]/page.tsx`:
- `params.slug` is `string[]` instead of `string`
- Slug is joined with `/` for the API call
- Preview mode is detected via `searchParams.token`
- `notFound()` for slug arrays > 2 segments
- Supports both published and preview mode in one file

```tsx
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPage, getCmsPagePreview } from "@lib/data/cms-pages"
import { mergeLayoutWithContent, HIDE_DEFAULT_NAV_FOOTER_CSS } from "@lib/data/cms-layout-merge"
import { getRegion } from "@lib/data/regions"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { GjsRenderer } from "./gjs-renderer"
import { HttpTypes } from "@medusajs/types"
import ProductsGridServer from "./products-grid-server"

type Props = {
  params: Promise<{ countryCode: string; slug: string[] }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug: slugSegments } = await params
  const { token } = await searchParams

  if (slugSegments.length > 2) return {}

  const compositeSlug = slugSegments.join("/")
  const result = token
    ? await getCmsPagePreview(compositeSlug, token)
    : await getCmsPage(compositeSlug)

  if (!result) return {}

  const { page } = result

  return {
    title: page.seo_meta_title || page.title,
    description: page.seo_meta_description || undefined,
    openGraph: {
      title: page.seo_meta_title || page.title,
      description: page.seo_meta_description || undefined,
      images: page.seo_og_image_url ? [{ url: page.seo_og_image_url }] : undefined,
    },
  }
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: unknown
  gjsStyles?: unknown
  content?: unknown[]
  root?: unknown
}

// Parse products-grid placeholders from HTML
function extractProductsGrids(html: string): Array<{
  fullMatch: string
  collection: string
  limit: number
  columns: string
  showViewAll: boolean
}> {
  const grids: Array<{
    fullMatch: string
    collection: string
    limit: number
    columns: string
    showViewAll: boolean
  }> = []

  const regex = /<section[^>]*data-component="products-grid"[^>]*>[\s\S]*?<\/section>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const collectionMatch = tag.match(/data-collection="([^"]*)"/)
    const limitMatch = tag.match(/data-limit="([^"]*)"/)
    const columnsMatch = tag.match(/data-columns="([^"]*)"/)
    const viewAllMatch = tag.match(/data-show-view-all="([^"]*)"/)

    grids.push({
      fullMatch: tag,
      collection: collectionMatch?.[1] || "",
      limit: parseInt(limitMatch?.[1] || "4"),
      columns: columnsMatch?.[1] || "4",
      showViewAll: viewAllMatch?.[1] === "true",
    })
  }

  return grids
}

export default async function CmsPageRoute({ params, searchParams }: Props) {
  const { slug: slugSegments, countryCode } = await params
  const { token } = await searchParams

  // Max 2 segments (parent/child). More = 404.
  if (slugSegments.length > 2) {
    notFound()
  }

  const compositeSlug = slugSegments.join("/")
  const isPreview = !!token

  const [result, region] = await Promise.all([
    isPreview
      ? getCmsPagePreview(compositeSlug, token!)
      : getCmsPage(compositeSlug),
    getRegion(countryCode),
  ])

  if (!result) {
    notFound()
  }

  const { page, layout } = result
  const content = page.content as GjsContent

  // Handle GrapeJS format (gjsHtml present, or layout provides the HTML)
  if (content?.gjsHtml !== undefined || layout) {
    let html = content?.gjsHtml || ""
    let css = content?.gjsCss || ""
    const hasLayout = !!layout

    // Merge layout HTML/CSS with page content if layout exists
    if (layout) {
      const merged = mergeLayoutWithContent(layout, html, css)
      html = merged.html
      css = merged.css
    }

    // Check for products-grid components that need server-side data
    const productGrids = extractProductsGrids(html)
    const productGridComponents: Array<{
      placeholder: string
      collection: string
      limit: number
      columns: string
      showViewAll: boolean
      products: HttpTypes.StoreProduct[]
      region: HttpTypes.StoreRegion | null
    }> = []

    if (region && productGrids.length > 0) {
      for (const grid of productGrids) {
        let products: HttpTypes.StoreProduct[] = []

        if (grid.collection) {
          try {
            const collection = await getCollectionByHandle(grid.collection)
            if (collection) {
              const { response } = await listProducts({
                regionId: region.id,
                queryParams: {
                  collection_id: [collection.id],
                  limit: grid.limit,
                  fields: "*variants.calculated_price",
                },
              })
              products = response.products
            }
          } catch (error) {
            console.error(`Failed to fetch products for collection ${grid.collection}:`, error)
          }
        }

        const markerId = `__PRODUCTS_GRID_${productGridComponents.length}__`
        html = html.replace(grid.fullMatch, `<div data-products-grid-marker="${markerId}"></div>`)

        productGridComponents.push({
          placeholder: markerId,
          ...grid,
          products,
          region,
        })
      }
    }

    // Preview banner
    const previewBanner = isPreview ? (
      <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm font-semibold sticky top-0 z-50">
        PREVIEW MODE — This page is not published yet
      </div>
    ) : null

    // Split HTML at product grid markers and interleave React components
    if (productGridComponents.length > 0) {
      const parts: React.ReactNode[] = []
      let remaining = html

      for (let i = 0; i < productGridComponents.length; i++) {
        const marker = `<div data-products-grid-marker="__PRODUCTS_GRID_${i}__"></div>`
        const idx = remaining.indexOf(marker)

        if (idx >= 0) {
          const before = remaining.substring(0, idx)
          if (before) {
            parts.push(<div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: before }} />)
          }

          const pg = productGridComponents[i]
          parts.push(
            <ProductsGridServer
              key={`pg-${i}`}
              products={pg.products}
              region={pg.region!}
              columns={pg.columns}
              collection={pg.collection}
              showViewAll={pg.showViewAll}
            />
          )

          remaining = remaining.substring(idx + marker.length)
        }
      }

      if (remaining) {
        parts.push(<div key="html-last" dangerouslySetInnerHTML={{ __html: remaining }} />)
      }

      return (
        <div {...(hasLayout ? { "data-cms-full-layout": "true" } : {})}>
          {hasLayout && <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />}
          {previewBanner}
          {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
          {parts}
        </div>
      )
    }

    return (
      <div {...(hasLayout ? { "data-cms-full-layout": "true" } : {})}>
        {hasLayout && <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />}
        {previewBanner}
        <GjsRenderer html={html} css={css} />
      </div>
    )
  }

  // Legacy Puck format fallback
  return (
    <div>
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Fix homepage preview import**

The file `boutique-storefront/src/app/[countryCode]/(main)/preview/page.tsx` imports `GjsRenderer` from the path being deleted:

```ts
import { GjsRenderer } from "../page/[slug]/gjs-renderer"
```

Update this import to point to the new location:

```ts
import { GjsRenderer } from "../[...slug]/gjs-renderer"
```

- [ ] **Step 5: Delete old route directory**

```bash
rm -rf "boutique-storefront/src/app/[countryCode]/(main)/page/[slug]"
```

**Important:** Do NOT delete `boutique-storefront/src/app/[countryCode]/(main)/page.tsx` (homepage) — it's a file, not the `page/` directory. Only the `page/[slug]/` subdirectory is removed.

- [ ] **Step 6: Commit**

```bash
cd boutique-storefront
git add "src/app/[countryCode]/(main)/[...slug]/" "src/app/[countryCode]/(main)/preview/page.tsx"
git rm -r "src/app/[countryCode]/(main)/page/[slug]"
git commit -m "feat(cms): replace /page/[slug] with [...slug] catchall route"
```

---

### Task 13: Add redirect from /page/* to /* in next.config.js

**Files:**
- Modify: `boutique-storefront/next.config.js`

- [ ] **Step 1: Add redirects config**

Add the `redirects` async function to `nextConfig`:

```js
const nextConfig = {
  reactStrictMode: true,
  // ... existing config ...
  async redirects() {
    return [
      {
        source: "/:countryCode/page/:slug*",
        destination: "/:countryCode/:slug*",
        permanent: true,
      },
    ]
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add boutique-storefront/next.config.js
git commit -m "feat(cms): add permanent redirect from /page/* to /* for backwards compat"
```

---

### Task 14: Verify end-to-end

- [ ] **Step 1: Start both servers**

```bash
# Terminal 1
cd boutique && npx medusa develop

# Terminal 2
cd boutique-storefront && npm run dev
```

- [ ] **Step 2: Verify admin list**

1. Go to admin panel → CMS Pages
2. Verify pages appear in position order
3. Drag a page to reorder
4. Drop a page onto another to nest it
5. Expand/collapse children
6. Delete a parent (children should promote to root)

- [ ] **Step 3: Verify storefront**

1. Visit `http://localhost:8000/fr/about-us` (a published CMS page) — should render
2. Visit `http://localhost:8000/fr/about-us/team` (a sub-page) — should render
3. Visit `http://localhost:8000/fr/page/about-us` — should 301 redirect to `/fr/about-us`
4. Visit `http://localhost:8000/fr/nonexistent` — should show 404

- [ ] **Step 4: Verify preview**

1. From admin, click Preview on a page
2. Should open `http://localhost:8000/fr/about-us?token=xxx`
3. Should show the preview banner and the page content

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(cms): end-to-end fixes for page nesting and routing"
```
