import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { URL_REDIRECT_MODULE } from "../../../../modules/url-redirect"
import UrlRedirectModuleService from "../../../../modules/url-redirect/service"
import type { CreateUrlRedirectBulkSchema } from "../middlewares"

// POST /admin/url-redirects/bulk — create multiple redirects at once
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateUrlRedirectBulkSchema>,
  res: MedusaResponse
) => {
  const service: UrlRedirectModuleService = req.scope.resolve(URL_REDIRECT_MODULE)
  const { urls, target_type, target_id, target_label } = req.validatedBody

  const redirects = await Promise.all(
    urls.map((url) =>
      service.createUrlRedirects({
        source_url: url.trim(),
        target_type: target_type || "homepage",
        target_id: target_id || null,
        target_label: target_label || null,
        status_code: 301,
      })
    )
  )

  res.status(201).json({ redirects, count: redirects.length })
}
