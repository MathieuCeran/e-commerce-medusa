import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_PAGE_MODULE } from "../../../modules/cms-page"
import type CmsPageModuleService from "../../../modules/cms-page/service"
import type { CreateCmsLayoutSchema } from "./middlewares"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  const layouts = await service.listCmsLayouts({}, { order: { name: "ASC" } })
  res.json({ layouts })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateCmsLayoutSchema>,
  res: MedusaResponse
) => {
  const service: CmsPageModuleService = req.scope.resolve(CMS_PAGE_MODULE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout = await service.createCmsLayouts(req.validatedBody as any)
  res.status(201).json({ layout })
}
