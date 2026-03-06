import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// DELETE /admin/cms-layouts/:id
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  await db("cms_layout")
    .where({ id: req.params.id })
    .update({ deleted_at: new Date() })

  res.json({ id: req.params.id, deleted: true })
}
