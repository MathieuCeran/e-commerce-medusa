import type { ComponentConfig } from "@puckeditor/core"

export type HeroProps = {
  title: string
  subtitle: string
  imageUrl: string
  imageAlt: string
  ctaLabel: string
  ctaHref: string
  ctaLabel2: string
  ctaHref2: string
  alignment: "left" | "center" | "right"
  height: "small" | "medium" | "large" | "full"
  overlayOpacity: number
  overlayColor: string
  titleColor: string
  subtitleColor: string
  titleSize: "medium" | "large" | "xlarge"
}

export const Hero: ComponentConfig<HeroProps> = {
  label: "Hero",
  fields: {
    title: { type: "text", label: "Title" },
    subtitle: { type: "textarea", label: "Subtitle" },
    imageUrl: { type: "text", label: "Background Image URL" },
    imageAlt: { type: "text", label: "Image Alt Text" },
    ctaLabel: { type: "text", label: "Primary Button Label" },
    ctaHref: { type: "text", label: "Primary Button Link" },
    ctaLabel2: { type: "text", label: "Secondary Button Label" },
    ctaHref2: { type: "text", label: "Secondary Button Link" },
    alignment: {
      type: "select",
      label: "Text Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "Small (300px)", value: "small" },
        { label: "Medium (500px)", value: "medium" },
        { label: "Large (700px)", value: "large" },
        { label: "Full Screen", value: "full" },
      ],
    },
    titleSize: {
      type: "select",
      label: "Title Size",
      options: [
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
        { label: "Extra Large", value: "xlarge" },
      ],
    },
    titleColor: { type: "text", label: "Title Color (hex)" },
    subtitleColor: { type: "text", label: "Subtitle Color (hex)" },
    overlayColor: { type: "text", label: "Overlay Color (hex)" },
    overlayOpacity: {
      type: "number",
      label: "Overlay Opacity (0-100)",
      min: 0,
      max: 100,
    },
  },
  defaultProps: {
    title: "Welcome to Our Store",
    subtitle: "Discover our latest collection of premium products",
    imageUrl: "",
    imageAlt: "",
    ctaLabel: "Shop Now",
    ctaHref: "/store",
    ctaLabel2: "",
    ctaHref2: "",
    alignment: "center",
    height: "large",
    titleSize: "large",
    titleColor: "#ffffff",
    subtitleColor: "#ffffff",
    overlayColor: "#000000",
    overlayOpacity: 40,
  },
  render: ({
    title,
    subtitle,
    imageUrl,
    imageAlt,
    ctaLabel,
    ctaHref,
    ctaLabel2,
    ctaHref2,
    alignment,
    height,
    titleSize,
    titleColor,
    subtitleColor,
    overlayColor,
    overlayOpacity,
  }) => {
    const heightClasses = {
      small: "min-h-[300px]",
      medium: "min-h-[500px]",
      large: "min-h-[700px]",
      full: "min-h-screen",
    }

    const titleSizeClasses = {
      medium: "text-3xl md:text-4xl",
      large: "text-4xl md:text-5xl lg:text-6xl",
      xlarge: "text-5xl md:text-6xl lg:text-7xl",
    }

    const alignClasses = {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    }

    const hexToRgba = (hex: string, opacity: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
    }

    return (
      <section
        className={`relative w-full ${heightClasses[height]} flex`}
        style={{ background: imageUrl ? undefined : "#1f2937" }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: hexToRgba(overlayColor || "#000000", overlayOpacity) }}
        />
        <div
          className={`relative z-10 flex flex-col justify-center w-full px-6 md:px-12 py-16 max-w-7xl mx-auto ${alignClasses[alignment]}`}
        >
          <h1
            className={`${titleSizeClasses[titleSize]} font-bold max-w-4xl leading-tight`}
            style={{ color: titleColor }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-5 text-lg md:text-xl max-w-2xl leading-relaxed opacity-90"
              style={{ color: subtitleColor }}
            >
              {subtitle}
            </p>
          )}
          <div className="flex gap-4 mt-8 flex-wrap">
            {ctaLabel && ctaHref && (
              <a
                href={ctaHref}
                className="inline-block px-8 py-3.5 bg-white text-black font-semibold rounded hover:bg-gray-100 transition-colors"
              >
                {ctaLabel}
              </a>
            )}
            {ctaLabel2 && ctaHref2 && (
              <a
                href={ctaHref2}
                className="inline-block px-8 py-3.5 bg-transparent text-white font-semibold rounded border-2 border-white hover:bg-white/10 transition-colors"
              >
                {ctaLabel2}
              </a>
            )}
          </div>
        </div>
      </section>
    )
  },
}
