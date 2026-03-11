import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"

// GET /store/cms-pages/preview?slug=xxx&token=xxx — get page draft for preview
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const slug = req.query.slug
  const token = req.query.token

  if (!slug || typeof slug !== "string") {
    res.status(400).json({ message: "slug query parameter is required" })
    return
  }

  if (!token || typeof token !== "string") {
    res.status(401).json({ message: "Preview token required" })
    return
  }

  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const segments = slug.split("/").filter(Boolean)

  if (segments.length === 0 || segments.length > 2) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  let page: any = null

  if (segments.length === 1) {
    const [pages] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
      preview_token: token,
    })
    page = pages[0]
  } else {
    // For sub-page preview: find parent (by slug, any status), then child with token
    const [parents] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
    })
    const parent = parents[0]

    if (parent) {
      const [children] = await cmsPageService.listAndCountCmsPages({
        slug: segments[1],
        parent_id: parent.id,
        preview_token: token,
      })
      page = children[0]
    }
  }

  if (!page) {
    res.status(401).json({ message: "Invalid preview token or page not found" })
    return
  }

  // Fetch the page's assigned layout (if any)
  let layout = null
  if (page.layout_id) {
    try {
      layout = await cmsPageService.retrieveCmsLayout(page.layout_id)
    } catch {
      // Layout may have been deleted
    }
  }

  // Don't expose preview_token
  const { preview_token: _pt, ...previewPage } = page

  res.json({
    page: previewPage,
    layout: layout
      ? { id: layout.id, html: layout.html, css: layout.css, content_position: layout.content_position }
      : null,
  })
}
