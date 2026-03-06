import { MedusaService } from "@medusajs/framework/utils"
import CmsPage from "./models/cms-page"
import CmsLayout from "./models/cms-layout"

class CmsPageModuleService extends MedusaService({
  CmsPage,
  CmsLayout,
}) {}

export default CmsPageModuleService
