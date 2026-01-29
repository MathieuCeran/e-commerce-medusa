/**
 * Types for product import module
 */

// Source CSV row from boutique-export.csv
export interface SourceRow {
  images: string
  catégorie: string
  "nom du produit": string
  description: string
  référence: string
  TVA: string
  variations: string
  prix: string
  stock: string
  poids: string
  "ancienne url": string
  "données techniques": string
  PDFs: string
}

// Parsed variation from the variations field
export interface ParsedVariation {
  imageFile: string | null
  stock: number | null
  label: string
  deltaPrice: number | null
}

// Target CSV row for Medusa product-import-template
export interface TargetRow {
  "Product Handle": string
  "Product Title": string
  "Product Subtitle": string
  "Product Description": string
  "Product Status": string
  "Product Thumbnail": string
  "Product Weight": string
  "Product Discountable": string
  "Product Type ID": string
  "Product Collection ID": string
  "Product Category 1 ID": string
  "Product Category 1 Handle": string
  "Product Sales Channel 1 ID": string
  "Product Sales Channel 1 Name": string
  "Variant Title": string
  "Variant SKU": string
  "Variant Barcode": string
  "Variant Allow Backorder": string
  "Variant Manage Inventory": string
  "Variant Weight": string
  "Variant Length": string
  "Variant Width": string
  "Variant Height": string
  "Variant HS Code": string
  "Variant Origin Country": string
  "Variant MID Code": string
  "Variant Material": string
  "Variant EAN": string
  "Variant UPC": string
  "Variant Option 1 Name": string
  "Variant Option 1 Value": string
  "Variant Option 2 Name": string
  "Variant Option 2 Value": string
  "Variant Option 3 Name": string
  "Variant Option 3 Value": string
  "Variant Price EUR": string
  "Product Image 1 URL": string
  "Product Image 2 URL": string
  "Product Image 3 URL": string
  "Product Image 4 URL": string
}

// Option name determination
export type OptionNameType = "Format" | "Parfum" | "Title" | "Taille"

// Transform result
export interface TransformResult {
  csvContent: string
  warnings: string[]
  rowCount: number
  productCount: number
}

// Import result
export interface ImportResult {
  transactionId: string
  status: "pending_confirmation" | "confirmed" | "failed"
  createdProductsCountEstimate: number
  warnings: string[]
}

// SKU collision check result
export interface SkuCheckResult {
  existingSkus: Set<string>
}
