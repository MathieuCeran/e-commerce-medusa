import { MedusaService } from "@medusajs/framework/utils"
import CmsPage from "./models/cms-page"

class CmsPageModuleService extends MedusaService({
  CmsPage,
}) {}

export default CmsPageModuleService
