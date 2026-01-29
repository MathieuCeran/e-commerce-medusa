import type { ComponentConfig } from "@puckeditor/core"

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
    const widthClasses = {
      small: "max-w-[400px]",
      medium: "max-w-[600px]",
      large: "max-w-[900px]",
      full: "",
    }

    const roundedClasses = {
      none: "",
      small: "rounded",
      medium: "rounded-lg",
      large: "rounded-xl",
    }

    const alignClasses = {
      left: "mr-auto",
      center: "mx-auto",
      right: "ml-auto",
    }

    if (!url) {
      return (
        <div className="py-16 bg-gray-100 text-center text-gray-400">
          Add an image URL to display
        </div>
      )
    }

    return (
      <section
        style={{
          backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
          paddingTop,
          paddingBottom,
          paddingLeft,
          paddingRight,
        }}
      >
        <figure>
          <img
            src={url}
            alt={alt}
            className={`w-full ${widthClasses[width]} ${alignClasses[alignment]} ${roundedClasses[rounded]} ${shadow ? "shadow-xl" : ""}`}
          />
          {caption && (
            <figcaption
              className={`mt-3 text-sm text-gray-500 ${widthClasses[width]} ${alignClasses[alignment]}`}
              style={{ textAlign: alignment }}
            >
              {caption}
            </figcaption>
          )}
        </figure>
      </section>
    )
  },
}
