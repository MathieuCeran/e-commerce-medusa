import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../modules/cms-page"
import CmsPageModuleService from "../../../modules/cms-page/service"
import type { UpsertCmsLayoutSchema } from "./middlewares"

// GET /admin/cms-layouts — list all layouts
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)

  const layouts = await service.listCmsLayouts(
    {},
    { order: { type: "ASC" } }
  )

  res.json({ layouts })
}

// POST /admin/cms-layouts — upsert a layout (one per type)
export const POST = async (
  req: AuthenticatedMedusaRequest<UpsertCmsLayoutSchema>,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const { type, html, css, component_data } = req.validatedBody

  // Find existing layout of this type
  const existing = await service.listCmsLayouts({ type })

  // Soft-delete existing, then create fresh
  // (updateCmsLayouts has an internal MedusaJS metadata bug)
  if (existing.length > 0) {
    await service.softDeleteCmsLayouts([existing[0].id])
  }

  const layout = await service.createCmsLayouts({
    type,
    html,
    css,
    component_data,
  })

  res.json({ layout })
}
