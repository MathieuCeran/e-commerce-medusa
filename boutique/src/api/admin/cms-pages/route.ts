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
const RESERVED_SLUGS = ["/", "home", "homepage", "accueil"]

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
    order: { updated_at: "DESC" },
  })

  res.json({ pages, count })
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

  const { result: page } = await createCmsPageWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ page })
}
