import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"

// GET /store/cms-pages/:slug — get published page by slug
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  // Decode the slug (handles URL-encoded "/" for homepage)
  const slug = decodeURIComponent(req.params.slug)

  const filters: Record<string, unknown> = {
    slug,
    status: "published",
  }

  const storeId = req.query.store_id
  if (storeId && typeof storeId === "string") {
    filters.store_id = storeId
  }

  const [pages] = await cmsPageService.listAndCountCmsPages(filters)
  const page = pages[0]

  if (!page) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  // Fetch the page's assigned layout (if any)
  let layout = null
  if (page.layout_id) {
    try {
      layout = await cmsPageService.retrieveCmsLayout(page.layout_id)
    } catch {
      // Layout may have been deleted — continue without it
    }
  }

  // Don't expose preview_token to the public
  const { preview_token, ...publicPage } = page

  res.json({
    page: publicPage,
    layout: layout
      ? { id: layout.id, html: layout.html, css: layout.css, content_position: layout.content_position }
      : null,
  })
}
