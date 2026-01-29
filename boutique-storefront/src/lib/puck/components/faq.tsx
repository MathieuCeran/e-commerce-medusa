import type { ComponentConfig } from "@puckeditor/core"
import { AnimationWrapper } from "@modules/common/components/animation-wrapper"

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
    const widthClasses = {
      narrow: "max-w-xl",
      medium: "max-w-3xl",
      wide: "max-w-5xl",
    }

    return (
      <AnimationWrapper animation={animation}>
        <section
          className="px-6"
          style={{ backgroundColor, paddingTop, paddingBottom }}
        >
          <div className={`${widthClasses[width]} mx-auto`}>
            {(heading || subheading) && (
              <div className="text-center mb-10">
                {heading && (
                  <h2
                    className="text-2xl md:text-3xl font-bold"
                    style={{ color: headingColor }}
                  >
                    {heading}
                  </h2>
                )}
                {subheading && (
                  <p className="mt-3 text-lg" style={{ color: textColor }}>
                    {subheading}
                  </p>
                )}
              </div>
            )}
            <div className="divide-y divide-gray-200 border-t border-gray-200">
              {items.map((item, i) => (
                <details key={i} className="group py-5">
                  <summary
                    className="flex justify-between items-center cursor-pointer list-none font-semibold hover:opacity-80"
                    style={{ color: headingColor }}
                  >
                    {item.question}
                    <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">
                      +
                    </span>
                  </summary>
                  <p
                    className="mt-4 leading-relaxed"
                    style={{ color: textColor }}
                  >
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </AnimationWrapper>
    )
  },
}
