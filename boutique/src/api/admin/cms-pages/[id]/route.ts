import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"
import updateCmsPageWorkflow from "../../../../workflows/update-cms-page"
import deleteCmsPageWorkflow from "../../../../workflows/delete-cms-page"
import type { UpdateCmsPageSchema } from "../middlewares"

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
  await deleteCmsPageWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json({ id: req.params.id, deleted: true })
}
