import { ComponentConfig } from "@puckeditor/core"

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
  animation: "none" | "fade" | "slide-up" | "slide-left" | "slide-right"
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
    animation: "none",
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
    animation,
  }) => {
    const widthMap = {
      narrow: 600,
      medium: 800,
      wide: 1000,
      full: "100%",
    }

    const HeadingTag = headingLevel
    const fontSize = headingLevel === "h2" ? 32 : headingLevel === "h3" ? 26 : 22

    return (
      <section
        style={{
          background: backgroundColor === "transparent" ? undefined : backgroundColor,
          paddingTop,
          paddingBottom,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div
          style={{
            maxWidth: typeof widthMap[width] === "number" ? widthMap[width] : undefined,
            width: widthMap[width] === "100%" ? "100%" : undefined,
            margin: "0 auto",
            textAlign: alignment,
          }}
        >
          {heading && (
            <HeadingTag
              style={{
                fontSize,
                fontWeight: 600,
                marginBottom: 20,
                color: headingColor,
                lineHeight: 1.2,
              }}
            >
              {heading}
            </HeadingTag>
          )}
          {body && (
            <div>
              {body.split("\n").map((paragraph, i) => (
                <p
                  key={i}
                  style={{
                    marginBottom: 16,
                    lineHeight: 1.7,
                    color: textColor,
                    fontSize: 17,
                  }}
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
