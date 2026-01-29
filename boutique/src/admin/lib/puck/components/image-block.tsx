import { ComponentConfig } from "@puckeditor/core"

export type ImageBlockProps = {
  url: string
  alt: string
  caption: string
  width: "small" | "medium" | "large" | "full"
  alignment: "left" | "center" | "right"
  rounded: "none" | "small" | "medium" | "large"
  shadow: boolean
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  backgroundColor: string
}

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  label: "Image",
  fields: {
    url: { type: "text", label: "Image URL" },
    alt: { type: "text", label: "Alt Text" },
    caption: { type: "text", label: "Caption" },
    width: {
      type: "select",
      label: "Width",
      options: [
        { label: "Small (400px)", value: "small" },
        { label: "Medium (600px)", value: "medium" },
        { label: "Large (900px)", value: "large" },
        { label: "Full Width", value: "full" },
      ],
    },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    rounded: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Small (4px)", value: "small" },
        { label: "Medium (8px)", value: "medium" },
        { label: "Large (16px)", value: "large" },
      ],
    },
    shadow: {
      type: "radio",
      label: "Shadow",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
    paddingLeft: { type: "number", label: "Padding Left (px)", min: 0, max: 200 },
    paddingRight: { type: "number", label: "Padding Right (px)", min: 0, max: 200 },
    backgroundColor: { type: "text", label: "Background Color (hex)" },
  },
  defaultProps: {
    url: "",
    alt: "",
    caption: "",
    width: "large",
    alignment: "center",
    rounded: "none",
    shadow: false,
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: "transparent",
  },
  render: ({
    url,
    alt,
    caption,
    width,
    alignment,
    rounded,
    shadow,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    backgroundColor,
  }) => {
    const widthMap = {
      small: 400,
      medium: 600,
      large: 900,
      full: "100%",
    }

    const radiusMap = {
      none: 0,
      small: 4,
      medium: 8,
      large: 16,
    }

    const marginMap = {
      left: { marginRight: "auto" },
      center: { margin: "0 auto" },
      right: { marginLeft: "auto" },
    }

    if (!url) {
      return (
        <div
          style={{
            padding: "64px 24px",
            background: "#f3f4f6",
            textAlign: "center",
            color: "#9ca3af",
          }}
        >
          Add an image URL to display
        </div>
      )
    }

    return (
      <section
        style={{
          background: backgroundColor === "transparent" ? undefined : backgroundColor,
          paddingTop,
          paddingBottom,
          paddingLeft,
          paddingRight,
        }}
      >
        <figure style={{ margin: 0 }}>
          <img
            src={url}
            alt={alt}
            style={{
              display: "block",
              width: "100%",
              maxWidth: widthMap[width] === "100%" ? undefined : widthMap[width],
              borderRadius: radiusMap[rounded],
              boxShadow: shadow ? "0 10px 40px rgba(0,0,0,0.15)" : undefined,
              ...marginMap[alignment],
            }}
          />
          {caption && (
            <figcaption
              style={{
                marginTop: 12,
                fontSize: 14,
                color: "#6b7280",
                textAlign: alignment,
                maxWidth: widthMap[width] === "100%" ? undefined : widthMap[width],
                ...marginMap[alignment],
              }}
            >
              {caption}
            </figcaption>
          )}
        </figure>
      </section>
    )
  },
}
