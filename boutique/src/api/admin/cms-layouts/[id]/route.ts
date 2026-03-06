import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"

// DELETE /admin/cms-layouts/:id
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)

  await service.softDeleteCmsLayouts([req.params.id])

  res.json({ id: req.params.id, deleted: true })
}
