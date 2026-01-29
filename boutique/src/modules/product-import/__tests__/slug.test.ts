import { describe, it, expect } from "vitest"
import { slugify, generateShortId } from "../utils/slug"

describe("slugify", () => {
  it("should convert to lowercase", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world")
  })

  it("should remove accents", () => {
    expect(slugify("café crème")).toBe("cafe-creme")
    expect(slugify("Éléphant")).toBe("elephant")
    expect(slugify("naïve")).toBe("naive")
  })

  it("should replace non-alphanumeric chars with hyphens", () => {
    expect(slugify("hello@world!")).toBe("hello-world")
    expect(slugify("test/path")).toBe("test-path")
    expect(slugify("a + b = c")).toBe("a-b-c")
  })

  it("should trim leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello")
    expect(slugify("@@@test@@@")).toBe("test")
  })

  it("should collapse multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world")
    expect(slugify("test--value")).toBe("test-value")
  })

  it("should return 'product' for empty or invalid input", () => {
    expect(slugify("")).toBe("product")
    expect(slugify("   ")).toBe("product")
    expect(slugify("@@@")).toBe("product")
    expect(slugify(null as any)).toBe("product")
    expect(slugify(undefined as any)).toBe("product")
  })

  it("should handle real product names", () => {
    expect(slugify("Miel de Lavande 500g")).toBe("miel-de-lavande-500g")
    expect(slugify("Huile d'Olive Bio")).toBe("huile-d-olive-bio")
    expect(slugify("Savon Marseille 100%")).toBe("savon-marseille-100")
  })

  it("should handle URLs", () => {
    expect(slugify("produit-miel-lavande")).toBe("produit-miel-lavande")
    expect(slugify("/produit/miel-lavande/")).toBe("produit-miel-lavande")
  })
})

describe("generateShortId", () => {
  it("should generate a 6-character string", () => {
    const id = generateShortId()
    expect(id).toHaveLength(6)
  })

  it("should generate unique IDs", () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateShortId())
    }
    // Should have at least 95 unique IDs out of 100
    expect(ids.size).toBeGreaterThan(95)
  })

  it("should only contain alphanumeric characters", () => {
    for (let i = 0; i < 20; i++) {
      const id = generateShortId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    }
  })
})
