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
const RESERVED_SLUGS = ["/", "home", "homepage", "accueil"]

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

  await deleteCmsPageWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json({ id: req.params.id, deleted: true })
}
