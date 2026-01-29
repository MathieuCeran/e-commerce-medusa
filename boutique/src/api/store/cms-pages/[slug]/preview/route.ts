import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../../modules/cms-page"
import CmsPageModuleService from "../../../../../modules/cms-page/service"

// GET /store/cms-pages/:slug/preview?token=xxx — get page draft for preview
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = req.query.token

  if (!token || typeof token !== "string") {
    res.status(401).json({ message: "Preview token required" })
    return
  }

  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  // Decode the slug (handles URL-encoded "/" for homepage)
  const slug = decodeURIComponent(req.params.slug)

  const filters: Record<string, unknown> = {
    slug,
    preview_token: token,
  }

  const storeId = req.query.store_id
  if (storeId && typeof storeId === "string") {
    filters.store_id = storeId
  }

  const [pages] = await cmsPageService.listAndCountCmsPages(filters)
  const page = pages[0]

  if (!page) {
    res.status(401).json({ message: "Invalid preview token or page not found" })
    return
  }

  // Don't expose preview_token
  const { preview_token, ...previewPage } = page

  res.json({ page: previewPage })
}
