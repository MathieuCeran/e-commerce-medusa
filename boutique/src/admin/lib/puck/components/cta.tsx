import { ComponentConfig } from "@puckeditor/core"

export type CTAProps = {
  title: string
  text: string
  buttonLabel: string
  buttonHref: string
  buttonLabel2: string
  buttonHref2: string
  alignment: "left" | "center"
  backgroundColor: string
  textColor: string
  buttonBgColor: string
  buttonTextColor: string
  paddingTop: number
  paddingBottom: number
}

export const CTA: ComponentConfig<CTAProps> = {
  label: "Call to Action",
  fields: {
    title: { type: "text", label: "Title" },
    text: { type: "textarea", label: "Description" },
    buttonLabel: { type: "text", label: "Primary Button" },
    buttonHref: { type: "text", label: "Primary Button Link" },
    buttonLabel2: { type: "text", label: "Secondary Button" },
    buttonHref2: { type: "text", label: "Secondary Button Link" },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
      ],
    },
    backgroundColor: { type: "text", label: "Background Color (hex)" },
    textColor: { type: "text", label: "Text Color (hex)" },
    buttonBgColor: { type: "text", label: "Button Background (hex)" },
    buttonTextColor: { type: "text", label: "Button Text (hex)" },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
  },
  defaultProps: {
    title: "Ready to get started?",
    text: "Join thousands of customers who trust us.",
    buttonLabel: "Get Started",
    buttonHref: "/",
    buttonLabel2: "Learn More",
    buttonHref2: "",
    alignment: "center",
    backgroundColor: "#111827",
    textColor: "#ffffff",
    buttonBgColor: "#ffffff",
    buttonTextColor: "#111827",
    paddingTop: 64,
    paddingBottom: 64,
  },
  render: ({
    title,
    text,
    buttonLabel,
    buttonHref,
    buttonLabel2,
    buttonHref2,
    alignment,
    backgroundColor,
    textColor,
    buttonBgColor,
    buttonTextColor,
    paddingTop,
    paddingBottom,
  }) => {
    return (
      <section
        style={{
          background: backgroundColor,
          color: textColor,
          paddingTop,
          paddingBottom,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: alignment === "center" ? "0 auto" : undefined,
            textAlign: alignment,
          }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{title}</h2>
          {text && (
            <p style={{ marginTop: 16, fontSize: 18, opacity: 0.85, lineHeight: 1.6 }}>
              {text}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 28,
              justifyContent: alignment === "center" ? "center" : "flex-start",
              flexWrap: "wrap",
            }}
          >
            {buttonLabel && buttonHref && (
              <a
                href={buttonHref}
                style={{
                  display: "inline-block",
                  padding: "14px 28px",
                  background: buttonBgColor,
                  color: buttonTextColor,
                  fontWeight: 600,
                  borderRadius: 4,
                  textDecoration: "none",
                  fontSize: 16,
                }}
              >
                {buttonLabel}
              </a>
            )}
            {buttonLabel2 && buttonHref2 && (
              <a
                href={buttonHref2}
                style={{
                  display: "inline-block",
                  padding: "14px 28px",
                  background: "transparent",
                  color: textColor,
                  fontWeight: 600,
                  borderRadius: 4,
                  textDecoration: "none",
                  fontSize: 16,
                  border: `2px solid ${textColor}`,
                }}
              >
                {buttonLabel2}
              </a>
            )}
          </div>
        </div>
      </section>
    )
  },
}
