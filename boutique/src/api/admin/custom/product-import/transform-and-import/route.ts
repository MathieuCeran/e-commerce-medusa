import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_IMPORT_MODULE } from "../../../../../modules/product-import"
import type ProductImportModuleService from "../../../../../modules/product-import/service"

/**
 * POST /admin/custom/product-import/transform-and-import
 *
 * Main endpoint: Transform legacy CSV to Medusa format and trigger import.
 *
 * Request: multipart/form-data with 'file' field containing the CSV
 *
 * Response:
 * {
 *   success: boolean,
 *   import_id: string,
 *   status: "pending_confirmation" | "confirmed" | "failed",
 *   created_products_count_estimate: number,
 *   warnings: string[]
 * }
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  // Validate file presence
  const file = (req as any).file
  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Fichier manquant. Utilisez un champ 'file' en multipart/form-data."
    )
  }

  // Validate mime type
  const allowedMimeTypes = ["text/csv", "application/csv", "text/plain"]
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Type de fichier invalide: ${file.mimetype}. Attendu: CSV (text/csv)`
    )
  }

  // Get file content
  let fileContent: string
  try {
    fileContent = file.buffer.toString("utf-8")
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Impossible de lire le contenu du fichier"
    )
  }

  if (!fileContent.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Le fichier CSV est vide"
    )
  }

  // Resolve service
  const productImportService = req.scope.resolve<ProductImportModuleService>(
    PRODUCT_IMPORT_MODULE
  )

  // Transform and import
  const result = await productImportService.transformAndImport(
    fileContent,
    req.scope
  )

  if (result.status === "failed") {
    return res.status(400).json({
      success: false,
      import_id: result.transactionId || null,
      status: result.status,
      created_products_count_estimate: result.createdProductsCountEstimate,
      warnings: result.warnings,
      message: "L'import a échoué. Consultez les warnings pour plus de détails.",
    })
  }

  return res.status(200).json({
    success: true,
    import_id: result.transactionId,
    status: result.status,
    created_products_count_estimate: result.createdProductsCountEstimate,
    warnings: result.warnings,
  })
}
