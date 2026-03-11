import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"
import type { ReorderCmsPagesSchema } from "../middlewares"

// POST /admin/cms-pages/reorder — batch update positions and parents
export const POST = async (
  req: AuthenticatedMedusaRequest<ReorderCmsPagesSchema>,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const { items } = req.validatedBody

  // Fetch all referenced pages in one query
  const ids = items.map((item) => item.id)
  const [existingPages] = await cmsPageService.listAndCountCmsPages({
    id: ids,
  })

  const pageMap = new Map(existingPages.map((p: any) => [p.id, p]))

  // Validate all items
  for (const item of items) {
    const page = pageMap.get(item.id)
    if (!page) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Page "${item.id}" not found`
      )
    }

    // System pages cannot have a parent
    if ((page as any).is_system && item.parent_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot make the homepage a sub-page"
      )
    }

    if (item.parent_id) {
      // Cannot be own parent
      if (item.parent_id === item.id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Page "${item.id}" cannot be its own parent`
        )
      }

      // Parent must be in the items list or exist in DB, and must be root-level
      const parentInItems = items.find((i) => i.id === item.parent_id)
      if (parentInItems && parentInItems.parent_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest more than 1 level deep"
        )
      }

      const parentPage = pageMap.get(item.parent_id)
      if (!parentPage && !parentInItems) {
        // Parent not in the batch — check DB
        try {
          const dbParent = await cmsPageService.retrieveCmsPage(item.parent_id)
          if ((dbParent as any).parent_id) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Cannot nest under a sub-page"
            )
          }
          if ((dbParent as any).is_system) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Cannot nest under the homepage"
            )
          }
        } catch (e: any) {
          if (e.type === "not_found") {
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              `Parent page "${item.parent_id}" not found`
            )
          }
          throw e
        }
      }

      if (parentPage && (parentPage as any).is_system) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest under the homepage"
        )
      }
    }
  }

  // Apply all updates
  for (const item of items) {
    await cmsPageService.updateCmsPages({
      id: item.id,
      parent_id: item.parent_id,
      position: item.position,
    })
  }

  res.json({ success: true })
}
