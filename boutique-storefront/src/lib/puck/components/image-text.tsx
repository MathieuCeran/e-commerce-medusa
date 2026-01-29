import type { ComponentConfig } from "@puckeditor/core"
import { Button } from "@medusajs/ui"
import InteractiveLink from "@modules/common/components/interactive-link"

export type ImageTextProps = {
  title: string
  description: string
  imageUrl: string
  imageAlt: string
  ctaText: string
  ctaLink: string
  layout: "image-left" | "image-right"
  backgroundColor: string
  textColor: string
  titleColor: string
  paddingTop: number
  paddingBottom: number
}

export const ImageText: ComponentConfig<ImageTextProps> = {
  label: "Image & Text",
  fields: {
    title: { type: "text", label: "Title" },
    description: { type: "textarea", label: "Description" },
    imageUrl: { type: "text", label: "Image URL" },
    imageAlt: { type: "text", label: "Image Alt Text" },
    ctaText: { type: "text", label: "Button Text" },
    ctaLink: { type: "text", label: "Button Link" },
    layout: {
      type: "radio",
      label: "Layout",
      options: [
        { label: "Image Left", value: "image-left" },
        { label: "Image Right", value: "image-right" },
      ],
    },
    backgroundColor: { type: "text", label: "Background Color (hex)" },
    textColor: { type: "text", label: "Text Color (hex)" },
    titleColor: { type: "text", label: "Title Color (hex)" },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
  },
  defaultProps: {
    title: "Your Title Here",
    description: "Write a compelling description for this section.",
    imageUrl: "https://placehold.co/600x400",
    imageAlt: "Placeholder",
    ctaText: "",
    ctaLink: "",
    layout: "image-left",
    backgroundColor: "",
    textColor: "",
    titleColor: "",
    paddingTop: 64,
    paddingBottom: 64,
  },
  render: ({
    title,
    description,
    imageUrl,
    imageAlt,
    ctaText,
    ctaLink,
    layout,
    backgroundColor,
    textColor,
    titleColor,
    paddingTop,
    paddingBottom,
  }) => {
    const isImageRight = layout === "image-right"

    return (
      <section
        style={{ 
          backgroundColor: backgroundColor || undefined, 
          paddingTop, 
          paddingBottom 
        }}
        className="px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className={isImageRight ? "order-last" : "order-first"}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageAlt}
                className="w-full h-auto rounded-lg shadow-md object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg text-gray-400">
                No Image
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-start gap-6 min-w-0">
            <h2 
              className="text-3xl font-bold theme-heading"
              style={{ color: titleColor || undefined }}
            >
              {title}
            </h2>
            <p 
              className="text-lg theme-text whitespace-pre-wrap break-all"
              style={{ color: textColor || undefined }}
            >
              {description}
            </p>
            {ctaText && ctaLink && (
              <Button asChild variant="secondary">
                <a href={ctaLink}>{ctaText}</a>
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  },
}
