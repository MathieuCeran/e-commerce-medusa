import { ComponentConfig } from "@puckeditor/core"

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
    const heightMap = {
      small: 300,
      medium: 500,
      large: 700,
      full: "100vh",
    }

    const titleSizeMap = {
      medium: 36,
      large: 48,
      xlarge: 64,
    }

    const alignMap = {
      left: { textAlign: "left" as const, alignItems: "flex-start" },
      center: { textAlign: "center" as const, alignItems: "center" },
      right: { textAlign: "right" as const, alignItems: "flex-end" },
    }

    const hexToRgba = (hex: string, opacity: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
    }

    return (
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: typeof heightMap[height] === "number" ? `${heightMap[height]}px` : heightMap[height],
          display: "flex",
          background: imageUrl ? undefined : "#1f2937",
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={imageAlt}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hexToRgba(overlayColor || "#000000", overlayOpacity),
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            padding: "48px",
            maxWidth: 1200,
            margin: "0 auto",
            ...alignMap[alignment],
          }}
        >
          <h1
            style={{
              fontSize: titleSizeMap[titleSize],
              fontWeight: 700,
              color: titleColor,
              maxWidth: 900,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                marginTop: 20,
                fontSize: 20,
                color: subtitleColor,
                maxWidth: 700,
                lineHeight: 1.5,
                opacity: 0.9,
              }}
            >
              {subtitle}
            </p>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
            {ctaLabel && ctaHref && (
              <a
                href={ctaHref}
                style={{
                  display: "inline-block",
                  padding: "14px 32px",
                  background: "#fff",
                  color: "#000",
                  fontWeight: 600,
                  borderRadius: 4,
                  textDecoration: "none",
                  fontSize: 16,
                }}
              >
                {ctaLabel}
              </a>
            )}
            {ctaLabel2 && ctaHref2 && (
              <a
                href={ctaHref2}
                style={{
                  display: "inline-block",
                  padding: "14px 32px",
                  background: "transparent",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: 4,
                  textDecoration: "none",
                  fontSize: 16,
                  border: "2px solid #fff",
                }}
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
