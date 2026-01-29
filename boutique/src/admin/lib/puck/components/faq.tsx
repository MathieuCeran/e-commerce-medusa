import { ComponentConfig } from "@puckeditor/core"

type FaqItem = {
  question: string
  answer: string
}

export type FAQProps = {
  heading: string
  subheading: string
  items: FaqItem[]
  width: "narrow" | "medium" | "wide"
  backgroundColor: string
  headingColor: string
  textColor: string
  paddingTop: number
  paddingBottom: number
  animation: "none" | "fade" | "slide-up" | "slide-left" | "slide-right"
}

export const FAQ: ComponentConfig<FAQProps> = {
  label: "FAQ",
  fields: {
    heading: { type: "text", label: "Section Heading" },
    subheading: { type: "text", label: "Subheading" },
    width: {
      type: "select",
      label: "Content Width",
      options: [
        { label: "Narrow (600px)", value: "narrow" },
        { label: "Medium (800px)", value: "medium" },
        { label: "Wide (1000px)", value: "wide" },
      ],
    },
    items: {
      type: "array",
      label: "Questions",
      arrayFields: {
        question: { type: "text", label: "Question" },
        answer: { type: "textarea", label: "Answer" },
      },
      defaultItemProps: {
        question: "Question?",
        answer: "Answer.",
      },
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
    heading: "Frequently Asked Questions",
    subheading: "Find answers to common questions",
    width: "medium",
    items: [
      { question: "What is your return policy?", answer: "We offer a 30-day return policy on all items. If you're not satisfied, simply return the product in its original condition for a full refund." },
      { question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery." },
      { question: "Do you ship internationally?", answer: "Yes! We ship to over 50 countries worldwide. International shipping times vary by location." },
    ],
    backgroundColor: "#f9fafb",
    headingColor: "#111827",
    textColor: "#4b5563",
    paddingTop: 64,
    paddingBottom: 64,
    animation: "none",
  },
  render: ({
    heading,
    subheading,
    width,
    items,
    backgroundColor,
    headingColor,
    textColor,
    paddingTop,
    paddingBottom,
    animation,
  }) => {
    const widthMap = { narrow: 600, medium: 800, wide: 1000 }

    return (
      <section
        style={{
          background: backgroundColor,
          paddingTop,
          paddingBottom,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div style={{ maxWidth: widthMap[width], margin: "0 auto" }}>
          {(heading || subheading) && (
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              {heading && (
                <h2 style={{ fontSize: 32, fontWeight: 700, color: headingColor, margin: 0 }}>
                  {heading}
                </h2>
              )}
              {subheading && (
                <p style={{ marginTop: 12, fontSize: 18, color: textColor }}>
                  {subheading}
                </p>
              )}
            </div>
          )}
          <div style={{ borderTop: "1px solid #e5e7eb" }}>
            {items.map((item, i) => (
              <details
                key={i}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "20px 0",
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    cursor: "pointer",
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: headingColor,
                    fontSize: 17,
                  }}
                >
                  {item.question}
                  <span style={{ color: "#9ca3af", marginLeft: 16 }}>+</span>
                </summary>
                <p
                  style={{
                    marginTop: 16,
                    color: textColor,
                    lineHeight: 1.7,
                    fontSize: 16,
                  }}
                >
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    )
  },
}
