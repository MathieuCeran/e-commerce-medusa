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
  const layout = await service.updateCmsLayouts(req.params.id, {
    is_default: true,
  })
  res.json({ layout })
}
