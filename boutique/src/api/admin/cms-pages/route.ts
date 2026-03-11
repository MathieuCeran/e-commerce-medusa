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
