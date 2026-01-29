import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import publishCmsPageWorkflow from "../../../../../workflows/publish-cms-page"

// POST /admin/cms-pages/:id/publish
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result: page } = await publishCmsPageWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ page })
}
