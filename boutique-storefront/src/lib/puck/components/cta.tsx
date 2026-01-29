import type { ComponentConfig } from "@puckeditor/core"
import { AnimationWrapper } from "@modules/common/components/animation-wrapper"

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
  animation: "none" | "fade" | "slide-up" | "slide-left" | "slide-right"
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
    animation: "none",
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
    animation,
  }) => {
    return (
      <AnimationWrapper animation={animation}>
        <section
          className="px-6 md:px-12"
          style={{ backgroundColor, paddingTop, paddingBottom }}
        >
          <div
            className={`max-w-3xl ${alignment === "center" ? "mx-auto text-center" : "text-left"}`}
          >
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ color: textColor }}
            >
              {title}
            </h2>
            {text && (
              <p
                className="mt-4 text-lg opacity-85 leading-relaxed"
                style={{ color: textColor }}
              >
                {text}
              </p>
            )}
            <div
              className={`flex gap-4 mt-7 flex-wrap ${alignment === "center" ? "justify-center" : ""}`}
            >
              {buttonLabel && buttonHref && (
                <a
                  href={buttonHref}
                  className="inline-block px-7 py-3.5 font-semibold rounded transition-colors"
                  style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                >
                  {buttonLabel}
                </a>
              )}
              {buttonLabel2 && buttonHref2 && (
                <a
                  href={buttonHref2}
                  className="inline-block px-7 py-3.5 font-semibold rounded border-2 transition-colors"
                  style={{ color: textColor, borderColor: textColor }}
                >
                  {buttonLabel2}
                </a>
              )}
            </div>
          </div>
        </section>
      </AnimationWrapper>
    )
  },
}
