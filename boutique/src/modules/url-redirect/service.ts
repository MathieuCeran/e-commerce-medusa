import { MedusaService } from "@medusajs/framework/utils"
import UrlRedirect from "./models/url-redirect"

class UrlRedirectModuleService extends MedusaService({
  UrlRedirect,
}) {}

export default UrlRedirectModuleService
