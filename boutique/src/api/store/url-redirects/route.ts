import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { URL_REDIRECT_MODULE } from "../../../modules/url-redirect"
import UrlRedirectModuleService from "../../../modules/url-redirect/service"

// GET /store/url-redirects?source_url=/old-page — lookup redirect for a URL
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const sourceUrl = req.query.source_url

  if (!sourceUrl || typeof sourceUrl !== "string") {
    res.status(400).json({ message: "source_url query parameter is required" })
    return
  }

  const service: UrlRedirectModuleService = req.scope.resolve(URL_REDIRECT_MODULE)
  const [redirects] = await service.listAndCountUrlRedirects({
    source_url: sourceUrl,
  })

  if (!redirects.length) {
    res.status(404).json({ message: "No redirect found" })
    return
  }

  const redirect = redirects[0]
  res.json({ redirect })
}
