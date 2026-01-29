import type { ComponentConfig } from "@puckeditor/core"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import InteractiveLink from "@modules/common/components/interactive-link"

export type ProductsGridProps = {
  heading: string
  subheading: string
  collectionHandle: string
  limit: number
  columns: "2" | "3" | "4"
  showViewAll: boolean
  backgroundColor: string
  headingColor: string
  paddingTop: number
  paddingBottom: number
  // Injected at render time
  _products?: HttpTypes.StoreProduct[]
  _region?: HttpTypes.StoreRegion
}

export const ProductsGrid: ComponentConfig<ProductsGridProps> = {
  label: "Products Grid",
  fields: {
    heading: { type: "text", label: "Section Heading" },
    subheading: { type: "text", label: "Subheading" },
    collectionHandle: { type: "text", label: "Collection Handle" },
    limit: { type: "number", label: "Number of Products", min: 1, max: 12 },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "2 columns", value: "2" },
        { label: "3 columns", value: "3" },
        { label: "4 columns", value: "4" },
      ],
    },
    showViewAll: {
      type: "radio",
      label: "Show 'View All' Link",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    backgroundColor: { type: "text", label: "Background Color (hex)" },
    headingColor: { type: "text", label: "Heading Color (hex)" },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
  },
  defaultProps: {
    heading: "Featured Products",
    subheading: "Check out our latest arrivals",
    collectionHandle: "",
    limit: 4,
    columns: "4",
    showViewAll: true,
    backgroundColor: "#ffffff",
    headingColor: "#111827",
    paddingTop: 64,
    paddingBottom: 64,
  },
  render: ({
    heading,
    subheading,
    collectionHandle,
    columns,
    showViewAll,
    backgroundColor,
    headingColor,
    paddingTop,
    paddingBottom,
    _products,
    _region,
  }) => {
    const gridClasses = {
      "2": "grid-cols-1 xsmall:grid-cols-2",
      "3": "grid-cols-1 xsmall:grid-cols-2 small:grid-cols-3",
      "4": "grid-cols-2 xsmall:grid-cols-4",
    }

    const products = _products || []
    const region = _region

    if (!region) {
      return (
        <section
          className="px-6 md:px-12"
          style={{ backgroundColor, paddingTop, paddingBottom }}
        >
          <div className="max-w-7xl mx-auto text-center text-gray-500">
            Products will appear here
          </div>
        </section>
      )
    }

    return (
      <section
        className="px-6 md:px-12"
        style={{ backgroundColor, paddingTop, paddingBottom }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              {heading && (
                <h2
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: headingColor }}
                >
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className="mt-2 text-gray-600">{subheading}</p>
              )}
            </div>
            {showViewAll && collectionHandle && (
              <InteractiveLink href={`/collections/${collectionHandle}`}>
                View all
              </InteractiveLink>
            )}
          </div>

          {products.length > 0 ? (
            <ul className={`grid ${gridClasses[columns]} gap-x-6 gap-y-12`}>
              {products.map((product) => (
                <li key={product.id}>
                  <ProductPreview product={product} region={region} isFeatured />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {collectionHandle
                ? `No products found in collection "${collectionHandle}"`
                : "Select a collection to display products"}
            </div>
          )}
        </div>
      </section>
    )
  },
}
