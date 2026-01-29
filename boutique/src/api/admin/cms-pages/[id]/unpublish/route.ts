import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import unpublishCmsPageWorkflow from "../../../../../workflows/unpublish-cms-page"

// POST /admin/cms-pages/:id/unpublish
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result: page } = await unpublishCmsPageWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ page })
}
