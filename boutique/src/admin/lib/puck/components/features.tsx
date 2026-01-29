import { ComponentConfig } from "@puckeditor/core"

type FeatureItem = {
  icon: string
  title: string
  description: string
}

export type FeaturesProps = {
  heading: string
  subheading: string
  columns: "2" | "3" | "4"
  items: FeatureItem[]
  backgroundColor: string
  headingColor: string
  textColor: string
  iconSize: "small" | "medium" | "large"
  paddingTop: number
  paddingBottom: number
}

export const Features: ComponentConfig<FeaturesProps> = {
  label: "Features",
  fields: {
    heading: { type: "text", label: "Section Heading" },
    subheading: { type: "text", label: "Subheading" },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "2 columns", value: "2" },
        { label: "3 columns", value: "3" },
        { label: "4 columns", value: "4" },
      ],
    },
    iconSize: {
      type: "select",
      label: "Icon Size",
      options: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
      ],
    },
    items: {
      type: "array",
      label: "Features",
      arrayFields: {
        icon: { type: "text", label: "Emoji / Icon" },
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
      },
      defaultItemProps: {
        icon: "✨",
        title: "Feature",
        description: "Description of this feature",
      },
    },
    backgroundColor: { type: "text", label: "Background Color (hex)" },
    headingColor: { type: "text", label: "Heading Color (hex)" },
    textColor: { type: "text", label: "Text Color (hex)" },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
  },
  defaultProps: {
    heading: "Why Choose Us",
    subheading: "Everything you need to succeed",
    columns: "3",
    iconSize: "medium",
    items: [
      { icon: "🚀", title: "Fast Delivery", description: "Get your products delivered quickly and efficiently" },
      { icon: "🔒", title: "Secure Payment", description: "Your transactions are protected with enterprise-grade security" },
      { icon: "💬", title: "24/7 Support", description: "Our team is here to help you anytime, anywhere" },
    ],
    backgroundColor: "#ffffff",
    headingColor: "#111827",
    textColor: "#6b7280",
    paddingTop: 64,
    paddingBottom: 64,
  },
  render: ({
    heading,
    subheading,
    columns,
    items,
    iconSize,
    backgroundColor,
    headingColor,
    textColor,
    paddingTop,
    paddingBottom,
  }) => {
    const colCount = parseInt(columns)
    const iconSizeMap = { small: 32, medium: 48, large: 64 }

    return (
      <section
        style={{
          background: backgroundColor,
          paddingTop,
          paddingBottom,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {(heading || subheading) && (
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              {heading && (
                <h2 style={{ fontSize: 32, fontWeight: 700, color: headingColor, margin: 0 }}>
                  {heading}
                </h2>
              )}
              {subheading && (
                <p style={{ marginTop: 12, fontSize: 18, color: textColor }}>
                  {subheading}
                </p>
              )}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${colCount}, 1fr)`,
              gap: 32,
            }}
          >
            {items.map((item, i) => (
              <div key={i} style={{ textAlign: "center", padding: 16 }}>
                {item.icon && (
                  <span
                    style={{
                      fontSize: iconSizeMap[iconSize],
                      display: "block",
                      marginBottom: 16,
                    }}
                  >
                    {item.icon}
                  </span>
                )}
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: headingColor,
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: 15, color: textColor, lineHeight: 1.6, margin: 0 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  },
}
