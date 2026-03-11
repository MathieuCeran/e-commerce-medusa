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
  if (!layout)
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Layout not found")
  res.json({ layout })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateCmsLayoutSchema>,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const layout = await service.updateCmsLayouts({
    id: req.params.id,
    ...req.validatedBody,
  })
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
    await service.updateCmsPages({ id: page.id, layout_id: null })
  }

  await service.softDeleteCmsLayouts(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
