import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"
import { buildLayoutMap } from "../../../../modules/cms-page/utils"

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

  // Fetch layouts (header/footer)
  const layouts = await cmsPageService.listCmsLayouts({})

  // Don't expose preview_token to the public
  const { preview_token, ...publicPage } = page

  res.json({ page: publicPage, layouts: buildLayoutMap(layouts) })
}
