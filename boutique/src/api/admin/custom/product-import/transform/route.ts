import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_IMPORT_MODULE } from "../../../../../modules/product-import"
import type ProductImportModuleService from "../../../../../modules/product-import/service"

/**
 * POST /admin/custom/product-import/transform
 *
 * Debug endpoint: Transform legacy CSV and return the Medusa-compatible CSV
 * for inspection/download without triggering the actual import.
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

  // Transform CSV
  const result = await productImportService.transformCsv(
    fileContent,
    req.scope
  )

  if (result.rowCount === 0) {
    return res.status(400).json({
      success: false,
      message: "Aucune ligne valide après transformation",
      warnings: result.warnings,
    })
  }

  // Return CSV as downloadable file
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="product-import-template.csv"'
  )
  return res.send(result.csvContent)
}
