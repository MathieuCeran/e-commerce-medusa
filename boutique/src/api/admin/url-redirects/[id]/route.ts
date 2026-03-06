import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import updateUrlRedirectWorkflow from "../../../../workflows/update-url-redirect"
import deleteUrlRedirectWorkflow from "../../../../workflows/delete-url-redirect"
import type { UpdateUrlRedirectSchema } from "../middlewares"

// POST /admin/url-redirects/:id — update redirect
export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateUrlRedirectSchema>,
  res: MedusaResponse
) => {
  const { result: redirect } = await updateUrlRedirectWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  })
  res.json({ redirect })
}

// DELETE /admin/url-redirects/:id
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteUrlRedirectWorkflow(req.scope).run({
    input: { id: req.params.id },
  })
  res.status(200).json({ id: req.params.id, deleted: true })
}
