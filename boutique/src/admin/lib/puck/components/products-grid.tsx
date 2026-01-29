import type { ComponentConfig } from "@puckeditor/core"

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
}

export const ProductsGrid: ComponentConfig<ProductsGridProps> = {
  label: "Products Grid",
  fields: {
    heading: { type: "text", label: "Section Heading" },
    subheading: { type: "text", label: "Subheading" },
    collectionHandle: {
      type: "text",
      label: "Collection Handle",
    },
    limit: {
      type: "number",
      label: "Number of Products",
      min: 1,
      max: 12,
    },
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
    limit,
    columns,
    showViewAll,
    backgroundColor,
    headingColor,
    paddingTop,
    paddingBottom,
  }) => {
    const gridClasses = {
      "2": "grid-cols-2",
      "3": "grid-cols-3",
      "4": "grid-cols-4",
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
              <span className="text-sm text-blue-600 hover:underline">
                View all →
              </span>
            )}
          </div>

          {/* Preview placeholder - real products will be rendered on storefront */}
          <div className={`grid ${gridClasses[columns]} gap-6`}>
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg overflow-hidden"
              >
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Product {i + 1}</span>
                </div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>

          {!collectionHandle && (
            <p className="text-center text-amber-600 text-sm mt-4">
              Enter a collection handle to display products
            </p>
          )}
        </div>
      </section>
    )
  },
}
