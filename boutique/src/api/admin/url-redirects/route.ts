import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { URL_REDIRECT_MODULE } from "../../../modules/url-redirect"
import UrlRedirectModuleService from "../../../modules/url-redirect/service"
import createUrlRedirectWorkflow from "../../../workflows/create-url-redirect"
import type { CreateUrlRedirectSchema } from "./middlewares"

// GET /admin/url-redirects — list all redirects
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: UrlRedirectModuleService = req.scope.resolve(URL_REDIRECT_MODULE)
  const [redirects, count] = await service.listAndCountUrlRedirects({}, {
    order: { created_at: "DESC" },
  })
  res.json({ redirects, count })
}

// POST /admin/url-redirects — create single redirect
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateUrlRedirectSchema>,
  res: MedusaResponse
) => {
  const { result: redirect } = await createUrlRedirectWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.status(201).json({ redirect })
}
