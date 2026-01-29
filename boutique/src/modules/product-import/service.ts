import { MedusaService } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { slugify, generateShortId } from "./utils/slug"
import {
  parseSourceCsv,
  parseVariations,
  determineOptionName,
  convertWeight,
  parsePrice,
  stripHtml,
  buildTargetCsv,
  createEmptyTargetRow,
} from "./utils/csv"
import type {
  SourceRow,
  TargetRow,
  TransformResult,
  ImportResult,
  OptionNameType,
} from "./types"

/**
 * Product Import Module Service
 *
 * Handles CSV transformation from legacy boutique format to Medusa import format
 * and triggers Medusa's built-in product import workflow.
 */
class ProductImportModuleService extends MedusaService({}) {
  private shortIdForRun: string | null = null

  /**
   * Transform legacy CSV to Medusa format
   */
  async transformCsv(
    fileContent: string,
    container: MedusaContainer
  ): Promise<TransformResult> {
    const warnings: string[] = []

    // Generate a stable short ID for this run (for SKU collision handling)
    this.shortIdForRun = generateShortId()

    // Parse source CSV
    const sourceRows = parseSourceCsv(fileContent, warnings)

    if (sourceRows.length === 0) {
      warnings.push("Aucune ligne valide trouvée dans le CSV source")
      return {
        csvContent: "",
        warnings,
        rowCount: 0,
        productCount: 0,
      }
    }

    // Transform to target rows
    const targetRows = this.transformRows(sourceRows, warnings)

    // Ensure SKU uniqueness within file
    this.ensureSkuUniquenessInFile(targetRows, warnings)

    // Check DB collisions and fix
    await this.ensureSkuUniquenessAgainstDb(targetRows, container, warnings)

    // Build CSV output
    const csvContent = buildTargetCsv(targetRows)

    // Count unique products
    const productHandles = new Set(targetRows.map((r) => r["Product Handle"]))

    return {
      csvContent,
      warnings,
      rowCount: targetRows.length,
      productCount: productHandles.size,
    }
  }

  /**
   * Transform source rows to target rows
   */
  private transformRows(sourceRows: SourceRow[], warnings: string[]): TargetRow[] {
    const targetRows: TargetRow[] = []

    // Group by product handle for option name determination
    const productGroups = new Map<
      string,
      { source: SourceRow; variations: ReturnType<typeof parseVariations> }[]
    >()

    // First pass: collect all variations per product
    for (const source of sourceRows) {
      const productName = source["nom du produit"]?.trim() || ""
      const ancienneUrl = source["ancienne url"]?.trim() || ""

      // Determine handle
      const handle = ancienneUrl
        ? slugify(ancienneUrl)
        : slugify(productName)

      const variations = parseVariations(
        source.variations || "",
        warnings,
        productName
      )

      if (!productGroups.has(handle)) {
        productGroups.set(handle, [])
      }
      productGroups.get(handle)!.push({ source, variations })
    }

    // Second pass: determine option name per product and generate rows
    for (const [handle, items] of productGroups) {
      // Collect all labels for this product
      const allLabels: string[] = []
      for (const { variations } of items) {
        for (const v of variations) {
          allLabels.push(v.label)
        }
      }

      // Determine option name (same for all variants of this product)
      const optionName: OptionNameType =
        allLabels.length > 0 ? determineOptionName(allLabels) : "Title"

      // Generate rows for this product
      for (const { source, variations } of items) {
        const rows = this.transformSingleProduct(
          source,
          handle,
          optionName,
          variations,
          warnings
        )
        targetRows.push(...rows)
      }
    }

    return targetRows
  }

  /**
   * Transform a single source product to one or more target rows
   */
  private transformSingleProduct(
    source: SourceRow,
    handle: string,
    optionName: OptionNameType,
    variations: ReturnType<typeof parseVariations>,
    warnings: string[]
  ): TargetRow[] {
    const rows: TargetRow[] = []

    const productName = source["nom du produit"]?.trim() || ""
    const description = stripHtml(source.description || "")
    const basePrice = parsePrice(source.prix)
    const weightGrams = convertWeight(source.poids || "")

    // Parse images
    const imagesStr = source.images || ""
    const images = imagesStr
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
    const thumbnail = images[0] || ""
    const image1 = images[0] || ""
    const image2 = images[1] || ""
    const image3 = images[2] || ""
    const image4 = images[3] || ""

    // If no variations, create a single "Default" variant
    if (variations.length === 0) {
      const row = createEmptyTargetRow()

      row["Product Handle"] = handle
      row["Product Title"] = productName
      row["Product Description"] = description
      row["Product Status"] = "published"
      row["Product Thumbnail"] = thumbnail
      row["Product Weight"] = weightGrams
      row["Product Discountable"] = "true"
      row["Variant Option 1 Name"] = optionName
      row["Variant Option 1 Value"] = "Default"
      row["Variant Title"] = "Default"
      row["Variant SKU"] = handle // Will be made unique later
      row["Variant Allow Backorder"] = "false"
      row["Variant Manage Inventory"] = "true"
      row["Variant Weight"] = weightGrams
      row["Variant Price EUR"] = basePrice !== null ? basePrice.toString() : ""
      row["Product Image 1 URL"] = image1
      row["Product Image 2 URL"] = image2
      row["Product Image 3 URL"] = image3
      row["Product Image 4 URL"] = image4

      rows.push(row)
    } else {
      // Create a row for each variation
      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i]
        const row = createEmptyTargetRow()

        // Calculate variant price
        let variantPrice: number | null = null
        if (basePrice !== null) {
          variantPrice = basePrice + (variation.deltaPrice || 0)
        }

        // SKU base
        const skuBase =
          variation.label.toLowerCase() === "default"
            ? handle
            : `${handle}-${slugify(variation.label)}`

        row["Product Handle"] = handle
        row["Product Title"] = productName
        row["Product Description"] = description
        row["Product Status"] = "published"
        row["Product Thumbnail"] = thumbnail
        row["Product Weight"] = weightGrams
        row["Product Discountable"] = "true"
        row["Variant Option 1 Name"] = optionName
        row["Variant Option 1 Value"] = variation.label // Option value = variant title
        row["Variant Title"] = variation.label
        row["Variant SKU"] = skuBase // Will be made unique later
        row["Variant Allow Backorder"] = "false"
        row["Variant Manage Inventory"] = "true"
        row["Variant Weight"] = weightGrams
        row["Variant Price EUR"] =
          variantPrice !== null ? variantPrice.toString() : ""
        row["Product Image 1 URL"] = image1
        row["Product Image 2 URL"] = image2
        row["Product Image 3 URL"] = image3
        row["Product Image 4 URL"] = image4

        // Handle variation-specific image if provided
        if (variation.imageFile) {
          // If variation has its own image, it could be added as metadata
          // For now, we keep product images
        }

        rows.push(row)
      }
    }

    return rows
  }

  /**
   * Ensure SKU uniqueness within the file
   * If duplicates found, suffix with -1, -2, etc.
   */
  private ensureSkuUniquenessInFile(
    rows: TargetRow[],
    warnings: string[]
  ): void {
    const skuCounts = new Map<string, number>()

    for (const row of rows) {
      const baseSku = row["Variant SKU"]

      if (!skuCounts.has(baseSku)) {
        skuCounts.set(baseSku, 0)
      } else {
        const count = skuCounts.get(baseSku)! + 1
        skuCounts.set(baseSku, count)
        const newSku = `${baseSku}-${count}`
        warnings.push(
          `SKU dupliqué dans fichier: "${baseSku}" -> "${newSku}"`
        )
        row["Variant SKU"] = newSku
      }
    }
  }

  /**
   * Check SKU collisions against database and fix
   */
  private async ensureSkuUniquenessAgainstDb(
    rows: TargetRow[],
    container: MedusaContainer,
    warnings: string[]
  ): Promise<void> {
    const query = container.resolve("query")

    // Collect all SKUs from rows
    const skus = rows.map((r) => r["Variant SKU"]).filter(Boolean)

    if (skus.length === 0) return

    // Batch query existing SKUs
    let existingSkus = new Set<string>()

    try {
      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["sku"],
        filters: {
          sku: skus,
        },
      })

      if (variants && Array.isArray(variants)) {
        existingSkus = new Set(
          variants
            .map((v: { sku?: string | null }) => v.sku)
            .filter((sku): sku is string => typeof sku === "string" && sku !== "")
        )
      }
    } catch (error) {
      // If query fails, continue without collision check
      warnings.push(
        `Impossible de vérifier les SKU existants: ${error instanceof Error ? error.message : String(error)}`
      )
      return
    }

    // Fix collisions
    for (const row of rows) {
      const sku = row["Variant SKU"]

      if (existingSkus.has(sku)) {
        const newSku = `${sku}-import-${this.shortIdForRun}`
        warnings.push(
          `SKU existant en base: "${sku}" -> "${newSku}"`
        )
        row["Variant SKU"] = newSku
      }
    }
  }

  /**
   * Transform CSV and trigger Medusa import
   */
  async transformAndImport(
    fileContent: string,
    container: MedusaContainer
  ): Promise<ImportResult> {
    const warnings: string[] = []

    // Transform CSV
    const transformResult = await this.transformCsv(fileContent, container)
    warnings.push(...transformResult.warnings)

    if (transformResult.rowCount === 0) {
      return {
        transactionId: "",
        status: "failed",
        createdProductsCountEstimate: 0,
        warnings: [
          ...warnings,
          "Aucun produit à importer après transformation",
        ],
      }
    }

    // Import using Medusa's importProductsWorkflow
    try {
      const { importProductsWorkflow } = await import(
        "@medusajs/medusa/core-flows"
      )

      const {
        result,
        transaction: { transactionId },
      } = await importProductsWorkflow(container).run({
        input: {
          fileContent: transformResult.csvContent,
          filename: "boutique-import.csv",
        },
      })

      // Confirm the import automatically
      await this.confirmImport(container, transactionId)

      return {
        transactionId,
        status: "confirmed",
        createdProductsCountEstimate: transformResult.productCount,
        warnings,
      }
    } catch (error: any) {
      // Extract meaningful error message from Medusa workflow errors
      let errorMessage = "Erreur inconnue"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "object" && error !== null) {
        // Medusa workflow errors often have nested structures
        errorMessage =
          error.message ||
          error.error?.message ||
          error.errors?.[0]?.message ||
          error.details ||
          JSON.stringify(error, null, 2)
      } else {
        errorMessage = String(error)
      }

      warnings.push(`Erreur import Medusa: ${errorMessage}`)

      // Log the full error for debugging
      console.error("Import error details:", error)

      return {
        transactionId: "",
        status: "failed",
        createdProductsCountEstimate: 0,
        warnings,
      }
    }
  }

  /**
   * Confirm a pending import using the Workflow Engine
   */
  private async confirmImport(
    container: MedusaContainer,
    transactionId: string
  ): Promise<void> {
    const {
      importProductsWorkflowId,
      waitConfirmationProductImportStepId,
    } = await import("@medusajs/core-flows")

    const { Modules, TransactionHandlerType } = await import(
      "@medusajs/framework/utils"
    )

    const { StepResponse } = await import("@medusajs/framework/workflows-sdk")

    const workflowEngineService = container.resolve(Modules.WORKFLOW_ENGINE)

    await workflowEngineService.setStepSuccess({
      idempotencyKey: {
        action: TransactionHandlerType.INVOKE,
        transactionId,
        stepId: waitConfirmationProductImportStepId,
        workflowId: importProductsWorkflowId,
      },
      stepResponse: new StepResponse(true),
    })
  }
}

export default ProductImportModuleService
