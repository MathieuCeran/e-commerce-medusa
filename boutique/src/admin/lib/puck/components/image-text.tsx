import type { ComponentConfig } from "@puckeditor/core"

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
    ctaText,
    layout,
    backgroundColor,
    textColor,
    titleColor,
    paddingTop,
    paddingBottom,
  }) => {
    return (
      <div 
        style={{ 
          backgroundColor: backgroundColor || '#ffffff', 
          paddingTop, 
          paddingBottom, 
          paddingLeft: 24, 
          paddingRight: 24,
          width: '100%' 
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row',
          gap: 48, 
          alignItems: 'center',
          maxWidth: 1280,
          margin: '0 auto' 
        }}>
          {/* Text Section */}
          
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24, order: layout === 'image-right' ? 1 : 2 }}>
            <div>
              <h2 style={{ fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 700, margin: 0, color: titleColor || '#111827' }}>{title}</h2>
              <p style={{ marginTop: '1.5rem', fontSize: '1.125rem', lineHeight: '1.75rem', color: textColor || '#4B5563', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{description}</p>
            </div>
            {ctaText && (
              <div>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '10px 20px', 
                  backgroundColor: '#f3f4f6', 
                  color: '#111827', 
                  borderRadius: 6, 
                  fontSize: 14, 
                  fontWeight: 500 
                }}>
                  {ctaText}
                </span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, order: layout === 'image-right' ? 2 : 1 }}>
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Preview" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  borderRadius: 8, 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                  objectFit: 'cover' 
                }} 
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: 300, 
                backgroundColor: '#e5e7eb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: 8,
                color: '#9ca3af' 
              }}>
                No Image
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
}
