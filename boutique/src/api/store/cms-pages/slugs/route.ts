import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cmsPageService: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)

  const [pages] = await cmsPageService.listAndCountCmsPages(
    { status: "published" },
    { select: ["id", "slug", "parent_id"] }
  )

  // Build composite slugs for parent/child pages
  const pageMap = new Map(pages.map((p: any) => [p.id, p]))
  const slugs: string[] = []

  for (const page of pages) {
    if ((page as any).slug === "/") continue // Skip homepage root

    if ((page as any).parent_id) {
      const parent = pageMap.get((page as any).parent_id)
      if (parent) {
        slugs.push(`${(parent as any).slug}/${(page as any).slug}`)
      } else {
        slugs.push((page as any).slug)
      }
    } else {
      slugs.push((page as any).slug)
    }
  }

  res.json({ slugs })
}
