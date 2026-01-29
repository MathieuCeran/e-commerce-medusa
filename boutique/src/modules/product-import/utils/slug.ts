/**
 * Slugify a string for use as product handle or SKU component
 *
 * Rules:
 * - lowercase
 * - remove accents
 * - replace non [a-z0-9] with "-"
 * - trim leading/trailing "-"
 * - return "product" if empty
 */
export function slugify(s: string): string {
  if (!s || typeof s !== "string") {
    return "product"
  }

  // Normalize to decompose accents, then remove diacritics
  let slug = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "product"
}

/**
 * Generate a short random ID (6 chars, base36)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8)
}
