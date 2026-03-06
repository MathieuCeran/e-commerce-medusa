import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../modules/cms-page"
import CmsPageModuleService from "../../../modules/cms-page/service"
import { buildLayoutMap } from "../../../modules/cms-page/utils"

// GET /store/cms-layouts — get all layouts (header/footer) for storefront
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)

  const layouts = await service.listCmsLayouts(
    {},
    { order: { type: "ASC" } }
  )

  res.json({ layouts: buildLayoutMap(layouts) })
}
