import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../modules/cms-page"
import CmsPageModuleService from "../../../modules/cms-page/service"

// GET /store/cms-pages?slug=xxx — get published page by slug (supports composite slugs)
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const slug = req.query.slug

  if (!slug || typeof slug !== "string") {
    res.status(400).json({ message: "slug query parameter is required" })
    return
  }

  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const segments = slug.split("/").filter(Boolean)

  if (segments.length > 2) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  let page: any = null

  if (segments.length === 0) {
    // Homepage: slug = "/"
    const [pages] = await cmsPageService.listAndCountCmsPages({
      slug: "/",
      status: "published",
      parent_id: null,
    })
    page = pages[0]
  } else if (segments.length === 1) {
    // Root page lookup
    const [pages] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
      status: "published",
    })
    page = pages[0]
  } else {
    // Sub-page: find parent first, then child
    const [parents] = await cmsPageService.listAndCountCmsPages({
      slug: segments[0],
      parent_id: null,
      status: "published",
    })
    const parent = parents[0]

    if (parent) {
      const [children] = await cmsPageService.listAndCountCmsPages({
        slug: segments[1],
        parent_id: parent.id,
        status: "published",
      })
      page = children[0]
    }
  }

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
      // Layout not found — proceed without it
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
