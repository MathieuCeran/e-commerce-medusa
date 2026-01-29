import { describe, it, expect } from "vitest"
import {
  parseVariations,
  determineOptionName,
  convertWeight,
  parsePrice,
  stripHtml,
  parseSourceCsv,
} from "../utils/csv"

describe("parseVariations", () => {
  it("should return empty array for empty input", () => {
    const warnings: string[] = []
    expect(parseVariations("", warnings, "Test Product")).toEqual([])
    expect(parseVariations("  ", warnings, "Test Product")).toEqual([])
    expect(parseVariations(null as any, warnings, "Test Product")).toEqual([])
  })

  it("should parse single variation", () => {
    const warnings: string[] = []
    const result = parseVariations("||10|Lavande|5", warnings, "Test Product")

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      imageFile: null,
      stock: 10,
      label: "Lavande",
      deltaPrice: 5,
    })
  })

  it("should parse multiple variations", () => {
    const warnings: string[] = []
    const result = parseVariations(
      "||10|Lavande|5,||20|Menthe|3",
      warnings,
      "Test Product"
    )

    expect(result).toHaveLength(2)
    expect(result[0].label).toBe("Lavande")
    expect(result[1].label).toBe("Menthe")
  })

  it("should handle variation with image file", () => {
    const warnings: string[] = []
    const result = parseVariations(
      "image.webp||10|Lavande|5",
      warnings,
      "Test Product"
    )

    expect(result[0].imageFile).toBe("image.webp")
  })

  it("should handle empty stock (999 = no stock management)", () => {
    const warnings: string[] = []
    const result = parseVariations("||999|Lavande|5", warnings, "Test Product")

    expect(result[0].stock).toBe(null)
  })

  it("should handle missing delta price", () => {
    const warnings: string[] = []
    const result = parseVariations("||10|Lavande|", warnings, "Test Product")

    expect(result[0].deltaPrice).toBe(null)
  })

  it("should handle French decimal format in delta price", () => {
    const warnings: string[] = []
    const result = parseVariations("||10|Lavande|5,50", warnings, "Test Product")

    expect(result[0].deltaPrice).toBe(5.5)
  })

  it("should parse real-world variation string", () => {
    const warnings: string[] = []
    const input =
      "1736162405-image.webp||999|Lavande|,||0|500 g|5,||999|1 litre|"
    const result = parseVariations(input, warnings, "Test Product")

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      imageFile: "1736162405-image.webp",
      stock: null,
      label: "Lavande",
      deltaPrice: null,
    })
    expect(result[1]).toEqual({
      imageFile: null,
      stock: 0,
      label: "500 g",
      deltaPrice: 5,
    })
    expect(result[2]).toEqual({
      imageFile: null,
      stock: null,
      label: "1 litre",
      deltaPrice: null,
    })
  })

  it("should skip invalid variations and add warnings", () => {
    const warnings: string[] = []
    const result = parseVariations(
      "invalid||,||10|ValidLabel|5",
      warnings,
      "Test Product"
    )

    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("ValidLabel")
    expect(warnings.length).toBeGreaterThan(0)
  })
})

describe("determineOptionName", () => {
  it("should return 'Title' for empty labels", () => {
    expect(determineOptionName([])).toBe("Title")
  })

  it("should return 'Format' when majority contain format keywords", () => {
    expect(determineOptionName(["500 ml", "1 litre", "250 ml"])).toBe("Format")
    expect(determineOptionName(["100g", "200g", "500g"])).toBe("Format")
    expect(determineOptionName(["1 kg", "2 kg"])).toBe("Format")
  })

  it("should return 'Parfum' when majority contain parfum keywords", () => {
    expect(determineOptionName(["Lavande", "Menthe", "Rose"])).toBe("Parfum")
    expect(determineOptionName(["Olive", "Citron"])).toBe("Parfum")
    expect(determineOptionName(["Miel", "Thym", "Romarin"])).toBe("Parfum")
  })

  it("should return 'Title' when no majority", () => {
    expect(determineOptionName(["Rouge", "Bleu", "Vert"])).toBe("Title")
    expect(determineOptionName(["Small", "Medium", "Large"])).toBe("Title")
  })

  it("should handle mixed labels and pick majority", () => {
    // 2 format, 1 parfum -> Format wins
    expect(determineOptionName(["500 ml", "1 litre", "Lavande"])).toBe("Format")
  })
})

describe("convertWeight", () => {
  it("should convert kg to grams", () => {
    expect(convertWeight("0.5")).toBe("500")
    expect(convertWeight("1")).toBe("1000")
    expect(convertWeight("2.5")).toBe("2500")
  })

  it("should handle French decimal format", () => {
    expect(convertWeight("0,5")).toBe("500")
    expect(convertWeight("1,25")).toBe("1250")
  })

  it("should return empty string for invalid input", () => {
    expect(convertWeight("")).toBe("")
    expect(convertWeight("  ")).toBe("")
    expect(convertWeight("abc")).toBe("")
    expect(convertWeight(null as any)).toBe("")
  })

  it("should round to nearest gram", () => {
    expect(convertWeight("0.333")).toBe("333")
    expect(convertWeight("0.3335")).toBe("334")
  })
})

describe("parsePrice", () => {
  it("should parse valid prices", () => {
    expect(parsePrice("10")).toBe(10)
    expect(parsePrice("10.50")).toBe(10.5)
    expect(parsePrice("99.99")).toBe(99.99)
  })

  it("should handle French decimal format", () => {
    expect(parsePrice("10,50")).toBe(10.5)
    expect(parsePrice("99,99")).toBe(99.99)
  })

  it("should return null for invalid input", () => {
    expect(parsePrice("")).toBe(null)
    expect(parsePrice("  ")).toBe(null)
    expect(parsePrice("abc")).toBe(null)
    expect(parsePrice(null as any)).toBe(null)
  })
})

describe("stripHtml", () => {
  it("should remove HTML tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello")
    expect(stripHtml("<div><span>Test</span></div>")).toBe("Test")
  })

  it("should decode HTML entities", () => {
    expect(stripHtml("&amp;")).toBe("&")
    expect(stripHtml("&lt;")).toBe("<")
    expect(stripHtml("&gt;")).toBe(">")
    expect(stripHtml("&quot;")).toBe('"')
    expect(stripHtml("&#39;")).toBe("'")
    expect(stripHtml("&nbsp;")).toBe(" ")
  })

  it("should collapse whitespace", () => {
    expect(stripHtml("Hello   World")).toBe("Hello World")
    expect(stripHtml("  Test  ")).toBe("Test")
  })

  it("should handle complex HTML", () => {
    const html = `
      <div class="product-desc">
        <p>Miel de <strong>Lavande</strong> bio.</p>
        <ul>
          <li>100% naturel</li>
          <li>Origine France</li>
        </ul>
      </div>
    `
    const result = stripHtml(html)
    expect(result).not.toContain("<")
    expect(result).not.toContain(">")
    expect(result).toContain("Miel")
    expect(result).toContain("Lavande")
    expect(result).toContain("naturel")
  })

  it("should return empty string for empty input", () => {
    expect(stripHtml("")).toBe("")
    expect(stripHtml(null as any)).toBe("")
    expect(stripHtml(undefined as any)).toBe("")
  })
})

describe("parseSourceCsv", () => {
  it("should parse valid CSV with semicolon separator", () => {
    const warnings: string[] = []
    const csv = `images;catégorie;nom du produit;description;référence;TVA;variations;prix;stock;poids;ancienne url;données techniques;PDFs
"img1.jpg|img2.jpg";"Miel";"Miel de Lavande";"Description";"REF001";"20";"||10|Lavande|5";"15.50";"100";"0.5";"miel-lavande";"";""
`
    const result = parseSourceCsv(csv, warnings)

    expect(result).toHaveLength(1)
    expect(result[0]["nom du produit"]).toBe("Miel de Lavande")
    expect(result[0].images).toBe("img1.jpg|img2.jpg")
    expect(result[0].prix).toBe("15.50")
  })

  it("should handle quoted values", () => {
    const warnings: string[] = []
    const csv = `images;catégorie;nom du produit;description;référence;TVA;variations;prix;stock;poids;ancienne url;données techniques;PDFs
"img.jpg";"Cat";"Product \"Name\"";"Desc";"REF";"20";"";"10";"50";"1";"url";"";""
`
    const result = parseSourceCsv(csv, warnings)
    expect(result).toHaveLength(1)
  })

  it("should skip lines without product name", () => {
    const warnings: string[] = []
    const csv = `images;catégorie;nom du produit;description;référence;TVA;variations;prix;stock;poids;ancienne url;données techniques;PDFs
"img.jpg";"Cat";"";"Desc";"REF";"20";"";"10";"50";"1";"url";"";""
"img2.jpg";"Cat2";"Valid Product";"Desc2";"REF2";"20";"";"20";"50";"1";"url2";"";""
`
    const result = parseSourceCsv(csv, warnings)

    expect(result).toHaveLength(1)
    expect(result[0]["nom du produit"]).toBe("Valid Product")
    expect(warnings.some((w) => w.includes("manquant"))).toBe(true)
  })

  it("should handle spaces after separators", () => {
    const warnings: string[] = []
    const csv = `images;catégorie;nom du produit;description;référence;TVA;variations;prix;stock;poids;ancienne url;données techniques;PDFs
"img.jpg"; "Cat"; "Product Name"; "Desc"; "REF"; "20"; ""; "10"; "50"; "1"; "url"; ""; ""
`
    const result = parseSourceCsv(csv, warnings)
    expect(result).toHaveLength(1)
    expect(result[0]["nom du produit"]).toBe("Product Name")
  })
})
