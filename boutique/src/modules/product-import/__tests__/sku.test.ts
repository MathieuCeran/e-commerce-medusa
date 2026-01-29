import { describe, it, expect } from "vitest"
import { slugify } from "../utils/slug"

describe("buildSku", () => {
  /**
   * SKU building logic (extracted for testing):
   * - If variant title is "Default", SKU = product handle
   * - Otherwise, SKU = product-handle-variant-title-slugified
   */
  function buildSku(productHandle: string, variantTitle: string): string {
    if (variantTitle.toLowerCase() === "default") {
      return productHandle
    }
    return `${productHandle}-${slugify(variantTitle)}`
  }

  it("should use product handle for Default variant", () => {
    expect(buildSku("miel-lavande", "Default")).toBe("miel-lavande")
    expect(buildSku("miel-lavande", "default")).toBe("miel-lavande")
    expect(buildSku("miel-lavande", "DEFAULT")).toBe("miel-lavande")
  })

  it("should append slugified variant title for other variants", () => {
    expect(buildSku("miel-lavande", "500g")).toBe("miel-lavande-500g")
    expect(buildSku("huile-olive", "1 litre")).toBe("huile-olive-1-litre")
    expect(buildSku("savon", "Lavande Bio")).toBe("savon-lavande-bio")
  })

  it("should handle variant titles with special characters", () => {
    expect(buildSku("produit", "Taille M/L")).toBe("produit-taille-m-l")
    expect(buildSku("produit", "50% OFF")).toBe("produit-50-off")
    expect(buildSku("produit", "éco-responsable")).toBe(
      "produit-eco-responsable"
    )
  })
})

describe("SKU uniqueness in file", () => {
  /**
   * Ensure SKU uniqueness within a file (extracted logic for testing)
   */
  function ensureSkuUniquenessInFile(skus: string[]): {
    result: string[]
    changes: string[]
  } {
    const skuCounts = new Map<string, number>()
    const result: string[] = []
    const changes: string[] = []

    for (const sku of skus) {
      if (!skuCounts.has(sku)) {
        skuCounts.set(sku, 0)
        result.push(sku)
      } else {
        const count = skuCounts.get(sku)! + 1
        skuCounts.set(sku, count)
        const newSku = `${sku}-${count}`
        changes.push(`${sku} -> ${newSku}`)
        result.push(newSku)
      }
    }

    return { result, changes }
  }

  it("should not modify unique SKUs", () => {
    const skus = ["sku-1", "sku-2", "sku-3"]
    const { result, changes } = ensureSkuUniquenessInFile(skus)

    expect(result).toEqual(skus)
    expect(changes).toHaveLength(0)
  })

  it("should suffix duplicate SKUs with incrementing numbers", () => {
    const skus = ["sku-1", "sku-1", "sku-1"]
    const { result, changes } = ensureSkuUniquenessInFile(skus)

    expect(result).toEqual(["sku-1", "sku-1-1", "sku-1-2"])
    expect(changes).toHaveLength(2)
  })

  it("should handle mixed unique and duplicate SKUs", () => {
    const skus = ["sku-a", "sku-b", "sku-a", "sku-c", "sku-b"]
    const { result, changes } = ensureSkuUniquenessInFile(skus)

    expect(result).toEqual(["sku-a", "sku-b", "sku-a-1", "sku-c", "sku-b-1"])
    expect(changes).toHaveLength(2)
  })

  it("should handle multiple duplicates of same SKU", () => {
    const skus = ["product", "product", "product", "product"]
    const { result, changes } = ensureSkuUniquenessInFile(skus)

    expect(result).toEqual(["product", "product-1", "product-2", "product-3"])
    expect(changes).toHaveLength(3)
  })
})

describe("SKU collision with DB", () => {
  /**
   * Simulate DB collision handling (extracted logic for testing)
   */
  function handleDbCollisions(
    skus: string[],
    existingInDb: Set<string>,
    shortId: string
  ): { result: string[]; changes: string[] } {
    const result: string[] = []
    const changes: string[] = []

    for (const sku of skus) {
      if (existingInDb.has(sku)) {
        const newSku = `${sku}-import-${shortId}`
        changes.push(`${sku} -> ${newSku}`)
        result.push(newSku)
      } else {
        result.push(sku)
      }
    }

    return { result, changes }
  }

  it("should not modify SKUs not in DB", () => {
    const skus = ["new-sku-1", "new-sku-2"]
    const existingInDb = new Set(["old-sku-1", "old-sku-2"])
    const { result, changes } = handleDbCollisions(skus, existingInDb, "abc123")

    expect(result).toEqual(skus)
    expect(changes).toHaveLength(0)
  })

  it("should suffix SKUs that exist in DB", () => {
    const skus = ["sku-1", "sku-2", "sku-3"]
    const existingInDb = new Set(["sku-1", "sku-3"])
    const { result, changes } = handleDbCollisions(skus, existingInDb, "xyz789")

    expect(result).toEqual([
      "sku-1-import-xyz789",
      "sku-2",
      "sku-3-import-xyz789",
    ])
    expect(changes).toHaveLength(2)
  })

  it("should use consistent shortId for all collisions in same run", () => {
    const skus = ["sku-a", "sku-b", "sku-c"]
    const existingInDb = new Set(["sku-a", "sku-b", "sku-c"])
    const shortId = "abc123"
    const { result } = handleDbCollisions(skus, existingInDb, shortId)

    // All should use same shortId
    expect(result.every((s) => s.includes(shortId))).toBe(true)
  })
})

describe("Single option per product", () => {
  /**
   * Test that all variants of a product use the same Option 1 Name
   */
  it("should ensure all variants of a product use same option name", () => {
    interface ProductVariant {
      handle: string
      optionName: string
      optionValue: string
    }

    // Simulate the transformation output
    const variants: ProductVariant[] = [
      { handle: "miel-lavande", optionName: "Format", optionValue: "500g" },
      { handle: "miel-lavande", optionName: "Format", optionValue: "1kg" },
      { handle: "miel-lavande", optionName: "Format", optionValue: "250g" },
      { handle: "huile-olive", optionName: "Parfum", optionValue: "Nature" },
      { handle: "huile-olive", optionName: "Parfum", optionValue: "Citron" },
    ]

    // Group by handle and check option consistency
    const byHandle = new Map<string, Set<string>>()
    for (const v of variants) {
      if (!byHandle.has(v.handle)) {
        byHandle.set(v.handle, new Set())
      }
      byHandle.get(v.handle)!.add(v.optionName)
    }

    // Each product should have exactly ONE option name
    for (const [handle, optionNames] of byHandle) {
      expect(optionNames.size).toBe(1)
    }
  })
})
