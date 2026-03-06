import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"
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
    { order: { name: "ASC" } }
  )

  res.json({ layouts })
}

// POST /admin/cms-layouts — upsert a layout (one per name)
// All MedusaJS auto-generated mutation methods (create/update/delete/softDelete)
// crash on this model with internal metadata errors, so we use direct knex.
export const POST = async (
  req: AuthenticatedMedusaRequest<UpsertCmsLayoutSchema>,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { name, html, css, component_data } = req.validatedBody

  const existing = await service.listCmsLayouts({ name })

  if (existing.length > 0) {
    await db("cms_layout")
      .where({ id: existing[0].id })
      .update({
        html,
        css,
        component_data: JSON.stringify(component_data),
        updated_at: new Date(),
      })
  } else {
    const id = "cmslayo_" + crypto.randomBytes(16).toString("base64url").slice(0, 27)
    await db("cms_layout").insert({
      id,
      name,
      html,
      css,
      component_data: JSON.stringify(component_data),
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  const [layout] = await service.listCmsLayouts({ name })
  res.json({ layout })
}
