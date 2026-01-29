import { parse } from "csv-parse/sync"
import { stringify } from "csv-stringify/sync"
import type { SourceRow, TargetRow, ParsedVariation, OptionNameType } from "../types"

/**
 * CSV column order for Medusa product-import-template
 * Must match exactly the template structure for Medusa v2
 */
export const TARGET_COLUMNS: (keyof TargetRow)[] = [
  "Product Handle",
  "Product Title",
  "Product Subtitle",
  "Product Description",
  "Product Status",
  "Product Thumbnail",
  "Product Weight",
  "Product Discountable",
  "Product Type ID",
  "Product Collection ID",
  "Product Category 1 ID",
  "Product Category 1 Handle",
  "Product Sales Channel 1 ID",
  "Product Sales Channel 1 Name",
  "Variant Title",
  "Variant SKU",
  "Variant Barcode",
  "Variant Allow Backorder",
  "Variant Manage Inventory",
  "Variant Weight",
  "Variant Length",
  "Variant Width",
  "Variant Height",
  "Variant HS Code",
  "Variant Origin Country",
  "Variant MID Code",
  "Variant Material",
  "Variant EAN",
  "Variant UPC",
  "Variant Option 1 Name",
  "Variant Option 1 Value",
  "Variant Option 2 Name",
  "Variant Option 2 Value",
  "Variant Option 3 Name",
  "Variant Option 3 Value",
  "Variant Price EUR",
  "Product Image 1 URL",
  "Product Image 2 URL",
  "Product Image 3 URL",
  "Product Image 4 URL",
]

/**
 * Preprocess CSV content to handle messy formatting:
 * - Remove leading whitespace from each line
 * - Normalize line endings
 * - Trim spaces around column names in header
 */
function preprocessCsv(content: string): string {
  // Normalize line endings
  let normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Process each line
  const lines = normalized.split("\n")
  const processedLines = lines.map((line, index) => {
    // Trim leading whitespace from each line
    let trimmed = line.trimStart()

    // For the header line (first line), also clean up column names
    if (index === 0) {
      // Remove spaces between ; and " in header
      trimmed = trimmed.replace(/;\s+"/g, ';"')
    }

    return trimmed
  })

  return processedLines.join("\n")
}

/**
 * Parse source CSV from boutique-export format
 * Handles:
 * - semicolon separator
 * - quoted values
 * - spaces after separators
 * - leading whitespace on lines
 * - malformed lines (skipped with warnings)
 */
export function parseSourceCsv(
  content: string,
  warnings: string[]
): SourceRow[] {
  const rows: SourceRow[] = []

  // Preprocess the CSV to handle messy formatting
  const cleanedContent = preprocessCsv(content)

  try {
    const records = parse(cleanedContent, {
      delimiter: ";",
      quote: '"',
      trim: true,
      skip_empty_lines: true,
      columns: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_records_with_error: true,
      on_record: (record, context) => {
        // Check if record has minimum required fields
        if (!record["nom du produit"]) {
          warnings.push(
            `Ligne ${context.lines}: ignorée - "nom du produit" manquant`
          )
          return null
        }
        return record
      },
    })

    for (const record of records) {
      if (record) {
        rows.push(record as SourceRow)
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    warnings.push(`Erreur parsing CSV: ${msg}`)
  }

  return rows
}

/**
 * Parse the variations string field
 *
 * Format: "images#sep|OptionType|Stock|Label|PriceDelta,..."
 *
 * Examples:
 * - "image1.jpg#image2.jpg|Taille|10|L|5" = images, optionType="Taille", stock=10, label="L", delta=5
 * - "||999|Senior|0" = no images, no optionType, stock=999, label="Senior", delta=0
 * - "|Taille|999|Senior|0" = no images, optionType="Taille", stock=999, label="Senior", delta=0
 *
 * Parts (split by |):
 * 0: images (separated by # if multiple, can be empty)
 * 1: option type (can be empty)
 * 2: stock (999 = unlimited)
 * 3: label (required)
 * 4: price delta (optional)
 */
export function parseVariations(
  str: string,
  warnings: string[],
  productName: string
): ParsedVariation[] {
  if (!str || typeof str !== "string" || str.trim() === "") {
    return []
  }

  const variations: ParsedVariation[] = []
  const tokens = str.split(",")

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim()
    if (!token) continue

    try {
      // Split by "|" - keeping empty strings to preserve positions
      const parts = token.split("|")

      // We need at least 4 parts: images|optionType|stock|label
      // (delta is optional, so minimum 4)
      if (parts.length < 4) {
        warnings.push(
          `Produit "${productName}": variation ${i + 1} - format invalide (${parts.length} parties, min 4)`
        )
        continue
      }

      // Part 0: images (can be empty, multiple separated by #)
      const imagesStr = parts[0].trim()
      const imageFile = imagesStr || null
      // Note: if multiple images, we take the first one (or could store all)
      // const images = imagesStr ? imagesStr.split("#").map(s => s.trim()).filter(Boolean) : []

      // Part 1: option type (ignored - we determine it from labels)
      // const optionType = parts[1].trim()

      // Part 2: stock
      const stockStr = parts[2].trim()
      let stock: number | null = null
      if (stockStr !== "" && stockStr !== "999") {
        const parsed = parseInt(stockStr, 10)
        if (!isNaN(parsed)) {
          stock = parsed
        }
      }

      // Part 3: label (required)
      const label = parts[3].trim()
      if (!label) {
        warnings.push(
          `Produit "${productName}": variation ${i + 1} - label manquant`
        )
        continue
      }

      // Part 4: price delta (optional)
      let deltaPrice: number | null = null
      if (parts.length >= 5 && parts[4].trim() !== "") {
        // Handle French decimal format (comma -> dot)
        const deltaPriceStr = parts[4].trim().replace(",", ".")
        const parsed = parseFloat(deltaPriceStr)
        if (!isNaN(parsed)) {
          deltaPrice = parsed
        }
      }

      variations.push({
        imageFile,
        stock,
        label,
        deltaPrice,
      })
    } catch (error) {
      warnings.push(
        `Produit "${productName}": variation ${i + 1} - erreur de parsing`
      )
    }
  }

  return variations
}

/**
 * Determine the Option 1 Name based on variation labels
 *
 * Rules:
 * - If majority contain size keywords (senior, mega, petit, moyen, grand, xl, etc.) -> "Taille"
 * - Else if majority contain format keywords (ml, cl, l, litre, kg, g, gr) -> "Format"
 * - Else if majority contain parfum keywords (lavande, olive, miel, etc.) -> "Parfum"
 * - Else -> "Title"
 */
export function determineOptionName(labels: string[]): OptionNameType {
  if (labels.length === 0) {
    return "Title"
  }

  // Size keywords (for pizzas, clothing, etc.)
  const sizeRegex =
    /\b(senior|méga|mega|petit|petite|moyen|moyenne|grand|grande|xl|xxl|xs|s|m|l|mini|maxi|junior|family|familiale)\b/i

  // Format/quantity keywords
  const formatRegex = /\b(ml|cl|l|litre|litres|kg|g|gr|gramme|grammes)\b/i

  // Scent/flavor keywords
  const parfumRegex =
    /\b(lavande|olive|miel|thym|romarin|citron|orange|menthe|vanille|fleurs|rose|jasmin|eucalyptus)\b/i

  let sizeCount = 0
  let formatCount = 0
  let parfumCount = 0

  for (const label of labels) {
    if (sizeRegex.test(label)) sizeCount++
    if (formatRegex.test(label)) formatCount++
    if (parfumRegex.test(label)) parfumCount++
  }

  const majority = Math.ceil(labels.length / 2)

  // Check in order of priority
  if (sizeCount >= majority) {
    return "Taille"
  }
  if (formatCount >= majority) {
    return "Format"
  }
  if (parfumCount >= majority) {
    return "Parfum"
  }

  return "Title"
}

/**
 * Convert weight from kg (float) to grams (int)
 */
export function convertWeight(kgStr: string): string {
  if (!kgStr || kgStr.trim() === "") {
    return ""
  }

  // Handle French decimal format
  const normalized = kgStr.trim().replace(",", ".")
  const kg = parseFloat(normalized)

  if (isNaN(kg)) {
    return ""
  }

  return Math.round(kg * 1000).toString()
}

/**
 * Parse price string to number
 */
export function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr.trim() === "") {
    return null
  }

  // Handle French decimal format
  const normalized = priceStr.trim().replace(",", ".")
  const price = parseFloat(normalized)

  return isNaN(price) ? null : price
}

/**
 * Strip HTML tags from description
 */
export function stripHtml(html: string): string {
  if (!html) return ""
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Build target CSV string from rows
 * All values are quoted, UTF-8 encoding, newline \n
 */
export function buildTargetCsv(rows: TargetRow[]): string {
  const data = rows.map((row) => {
    const orderedRow: string[] = []
    for (const col of TARGET_COLUMNS) {
      orderedRow.push(row[col] || "")
    }
    return orderedRow
  })

  return stringify([TARGET_COLUMNS, ...data], {
    quoted: true,
    record_delimiter: "\n",
  })
}

/**
 * Create an empty target row with all fields initialized
 */
export function createEmptyTargetRow(): TargetRow {
  return {
    "Product Handle": "",
    "Product Title": "",
    "Product Subtitle": "",
    "Product Description": "",
    "Product Status": "published",
    "Product Thumbnail": "",
    "Product Weight": "",
    "Product Discountable": "true",
    "Product Type ID": "",
    "Product Collection ID": "",
    "Product Category 1 ID": "",
    "Product Category 1 Handle": "",
    "Product Sales Channel 1 ID": "",
    "Product Sales Channel 1 Name": "",
    "Variant Title": "",
    "Variant SKU": "",
    "Variant Barcode": "",
    "Variant Allow Backorder": "false",
    "Variant Manage Inventory": "true",
    "Variant Weight": "",
    "Variant Length": "",
    "Variant Width": "",
    "Variant Height": "",
    "Variant HS Code": "",
    "Variant Origin Country": "",
    "Variant MID Code": "",
    "Variant Material": "",
    "Variant EAN": "",
    "Variant UPC": "",
    "Variant Option 1 Name": "",
    "Variant Option 1 Value": "",
    "Variant Option 2 Name": "",
    "Variant Option 2 Value": "",
    "Variant Option 3 Name": "",
    "Variant Option 3 Value": "",
    "Variant Price EUR": "",
    "Product Image 1 URL": "",
    "Product Image 2 URL": "",
    "Product Image 3 URL": "",
    "Product Image 4 URL": "",
  }
}
