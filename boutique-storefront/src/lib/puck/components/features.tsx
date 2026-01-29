import type { ComponentConfig } from "@puckeditor/core"

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
    const gridClasses = {
      "2": "grid-cols-1 md:grid-cols-2",
      "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    }

    const iconSizeClasses = {
      small: "text-3xl",
      medium: "text-4xl",
      large: "text-5xl",
    }

    return (
      <section
        className="px-6 md:px-12"
        style={{ backgroundColor, paddingTop, paddingBottom }}
      >
        <div className="max-w-7xl mx-auto">
          {(heading || subheading) && (
            <div className="text-center mb-12">
              {heading && (
                <h2
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: headingColor }}
                >
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className="mt-3 text-lg" style={{ color: textColor }}>
                  {subheading}
                </p>
              )}
            </div>
          )}
          <div className={`grid ${gridClasses[columns]} gap-8`}>
            {items.map((item, i) => (
              <div key={i} className="text-center p-4">
                {item.icon && (
                  <span className={`${iconSizeClasses[iconSize]} block mb-4`}>
                    {item.icon}
                  </span>
                )}
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: headingColor }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: textColor }}
                >
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
