import { ComponentConfig } from "@puckeditor/core"

export type BentoGripItem = {
  title: string
  description: string
  imageUrl: string
  imageAlt: string
  span: "1" | "2" | "3"
}

export type BentoGridProps = {
  title: string
  items: BentoGripItem[]
  columns: number
  paddingTop: number
  paddingBottom: number
  backgroundColor: string
  textColor: string
  animation: "none" | "fade" | "slide-up" | "slide-left" | "slide-right"
}

export const BentoGrid: ComponentConfig<BentoGridProps> = {
  label: "Bento Grid",
  fields: {
    title: { type: "text", label: "Section Title" },
    items: {
      type: "array",
      label: "Grid Items",
      arrayFields: {
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
        imageUrl: { type: "text", label: "Image URL" },
        imageAlt: { type: "text", label: "Image Alt" },
        span: {
          type: "select",
          label: "Column Span",
          options: [
            { label: "1 Column", value: "1" },
            { label: "2 Columns", value: "2" },
            { label: "3 Columns (Full on standard grid)", value: "3" },
          ],
        },
      },
      defaultItemProps: {
        title: "New Item",
        description: "Description of the bento item.",
        imageUrl: "",
        imageAlt: "",
        span: "1",
      },
    },
    columns: {
      type: "number",
      label: "Total Columns (Admin Preview Fixed)",
      min: 1,
      max: 4,
    },
    backgroundColor: { type: "text", label: "Background color (hex)" },
    textColor: { type: "text", label: "Text color (hex)" },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
    animation: {
      type: "select",
      label: "Animation",
      options: [
        { label: "None", value: "none" },
        { label: "Fade In", value: "fade" },
        { label: "Slide Up", value: "slide-up" },
        { label: "Slide Left", value: "slide-left" },
        { label: "Slide Right", value: "slide-right" },
      ],
    },
  },
  defaultProps: {
    title: "Our Features",
    items: [
      {
        title: "Feature One",
        description: "This is a single column feature.",
        imageUrl: "https://placehold.co/400x300",
        imageAlt: "",
        span: "1",
      },
      {
        title: "Feature Two (Wide)",
        description: "This feature spans two columns for emphasis.",
        imageUrl: "https://placehold.co/800x300",
        imageAlt: "",
        span: "2",
      },
      {
        title: "Feature Three",
        description: "Another single column feature.",
        imageUrl: "https://placehold.co/400x300",
        imageAlt: "",
        span: "1",
      },
      {
        title: "Feature Four",
        description: "Filling the gap.",
        imageUrl: "https://placehold.co/400x300",
        imageAlt: "",
        span: "1",
      },
    ],
    columns: 3,
    backgroundColor: "#ffffff",
    textColor: "#000000",
    paddingTop: 64,
    paddingBottom: 64,
    animation: "none",
  },
  render: ({ items, title, paddingTop, paddingBottom, backgroundColor, textColor }) => {
    return (
      <section
        style={{
          paddingTop,
          paddingBottom,
          backgroundColor,
          color: textColor,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          {title && (
            <h2 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 40, textAlign: "center" }}>
              {title}
            </h2>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  gridColumn: `span ${item.span}`,
                  background: "#f9fafb",
                  borderRadius: 16,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                )}
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px 0" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 16, color: "#4b5563", margin: 0, lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  },
}
