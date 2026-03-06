import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import InteractiveLink from "@modules/common/components/interactive-link"

type ProductsGridServerProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  columns: string
  collection: string
  showViewAll: boolean
}

export default function ProductsGridServer({
  products,
  region,
  columns,
  collection,
  showViewAll,
}: ProductsGridServerProps) {
  const gridClasses: Record<string, string> = {
    "2": "grid-cols-1 xsmall:grid-cols-2",
    "3": "grid-cols-1 xsmall:grid-cols-2 small:grid-cols-3",
    "4": "grid-cols-2 xsmall:grid-cols-4",
  }

  return (
    <section style={{ padding: "64px 24px", background: "#ffffff" }}>
      <div className="max-w-7xl mx-auto">
        {products.length > 0 ? (
          <>
            {showViewAll && collection && (
              <div className="flex justify-end mb-4">
                <InteractiveLink href={`/collections/${collection}`}>
                  View all
                </InteractiveLink>
              </div>
            )}
            <ul className={`grid ${gridClasses[columns] || gridClasses["4"]} gap-x-6 gap-y-12`}>
              {products.map((product) => (
                <li key={product.id}>
                  <ProductPreview product={product} region={region} isFeatured />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {collection
              ? `No products found in collection "${collection}"`
              : "Select a collection to display products"}
          </div>
        )}
      </div>
    </section>
  )
}
