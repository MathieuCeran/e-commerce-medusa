import type { ComponentConfig } from "@puckeditor/core"

export type RichTextProps = {
  heading: string
  headingLevel: "h2" | "h3" | "h4"
  body: string
  width: "narrow" | "medium" | "wide" | "full"
  alignment: "left" | "center" | "right"
  backgroundColor: string
  textColor: string
  headingColor: string
  paddingTop: number
  paddingBottom: number
}

export const RichText: ComponentConfig<RichTextProps> = {
  label: "Rich Text",
  fields: {
    heading: { type: "text", label: "Heading" },
    headingLevel: {
      type: "select",
      label: "Heading Level",
      options: [
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
        { label: "H4", value: "h4" },
      ],
    },
    body: { type: "textarea", label: "Body Text" },
    width: {
      type: "select",
      label: "Content Width",
      options: [
        { label: "Narrow (600px)", value: "narrow" },
        { label: "Medium (800px)", value: "medium" },
        { label: "Wide (1000px)", value: "wide" },
        { label: "Full Width", value: "full" },
      ],
    },
    alignment: {
      type: "select",
      label: "Text Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    backgroundColor: { type: "text", label: "Background Color (hex)" },
    headingColor: { type: "text", label: "Heading Color (hex)" },
    textColor: { type: "text", label: "Text Color (hex)" },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
  },
  defaultProps: {
    heading: "",
    headingLevel: "h2",
    body: "",
    width: "medium",
    alignment: "left",
    backgroundColor: "transparent",
    headingColor: "#111827",
    textColor: "#374151",
    paddingTop: 48,
    paddingBottom: 48,
  },
  render: ({
    heading,
    headingLevel,
    body,
    width,
    alignment,
    backgroundColor,
    headingColor,
    textColor,
    paddingTop,
    paddingBottom,
  }) => {
    const widthClasses = {
      narrow: "max-w-xl",
      medium: "max-w-3xl",
      wide: "max-w-5xl",
      full: "w-full",
    }

    const HeadingTag = headingLevel
    const headingSizeClasses = {
      h2: "text-2xl md:text-3xl",
      h3: "text-xl md:text-2xl",
      h4: "text-lg md:text-xl",
    }

    return (
      <section
        className="px-6"
        style={{
          backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
          paddingTop,
          paddingBottom,
        }}
      >
        <div className={`${widthClasses[width]} mx-auto`} style={{ textAlign: alignment }}>
          {heading && (
            <HeadingTag
              className={`${headingSizeClasses[headingLevel]} font-semibold mb-5`}
              style={{ color: headingColor }}
            >
              {heading}
            </HeadingTag>
          )}
          {body && (
            <div>
              {body.split("\n").map((paragraph, i) => (
                <p
                  key={i}
                  className="mb-4 text-base md:text-lg leading-relaxed"
                  style={{ color: textColor }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  },
}
