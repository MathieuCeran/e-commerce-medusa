import type { ComponentConfig } from "@puckeditor/core"
import { Button } from "@medusajs/ui"
import InteractiveLink from "@modules/common/components/interactive-link"

export type CardItem = {
  imageUrl: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  backgroundColor: string
}

export type CardGridProps = {
  cards: CardItem[]
  columns: "2" | "3" | "4"
  backgroundColor: string
  titleColor: string
  textColor: string
  paddingTop: number
  paddingBottom: number
}

export const CardGrid: ComponentConfig<CardGridProps> = {
  label: "Card Grid",
  fields: {
    cards: {
      type: "array",
      label: "Cards",
      arrayFields: {
        imageUrl: { type: "text", label: "Image URL" },
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
        ctaText: { type: "text", label: "Button Text" },
        ctaLink: { type: "text", label: "Button Link" },
        backgroundColor: { type: "text", label: "Card Background (hex)" },
      },
      defaultItemProps: {
        imageUrl: "https://placehold.co/600x400",
        title: "Card Title",
        description: "Short description for this card.",
        ctaText: "Learn More",
        ctaLink: "#",
        backgroundColor: "#ffffff",
      },
    },
    columns: {
      type: "select",
      label: "Columns (Desktop)",
      options: [
        { label: "2 Columns", value: "2" },
        { label: "3 Columns", value: "3" },
        { label: "4 Columns", value: "4" },
      ],
    },
    backgroundColor: { type: "text", label: "Section Background (hex)" },
    titleColor: { type: "text", label: "Title Color (hex)" },
    textColor: { type: "text", label: "Text Color (hex)" },
    paddingTop: { type: "number", label: "Padding Top (px)", min: 0, max: 200 },
    paddingBottom: { type: "number", label: "Padding Bottom (px)", min: 0, max: 200 },
  },
  defaultProps: {
    cards: [
      {
        imageUrl: "https://placehold.co/600x400",
        title: "Card 1",
        description: "Description for card 1.",
        ctaText: "View",
        ctaLink: "#",
        backgroundColor: "#ffffff",
      },
      {
        imageUrl: "https://placehold.co/600x400",
        title: "Card 2",
        description: "Description for card 2.",
        ctaText: "View",
        ctaLink: "#",
        backgroundColor: "#ffffff",
      },
      {
        imageUrl: "https://placehold.co/600x400",
        title: "Card 3",
        description: "Description for card 3.",
        ctaText: "View",
        ctaLink: "#",
        backgroundColor: "#ffffff",
      },
    ],
    columns: "3",
    backgroundColor: "#ffffff",
    titleColor: "#111827",
    textColor: "#4B5563",
    paddingTop: 64,
    paddingBottom: 64,
  },
  render: ({
    cards,
    columns,
    backgroundColor,
    titleColor,
    textColor,
    paddingTop,
    paddingBottom,
  }) => {
    
    const gridCols = {
      "2": "md:grid-cols-2",
      "3": "md:grid-cols-3",
      "4": "md:grid-cols-4",
    }

    return (
      <section
        style={{
          backgroundColor: backgroundColor || undefined,
          paddingTop,
          paddingBottom,
        }}
        className="px-6 md:px-12 w-full"
      >
        <div 
          className={`grid grid-cols-1 ${gridCols[columns]} gap-8 max-w-[1400px] mx-auto`}
        >
          {cards.map((card, i) => (
            <div 
              key={i} 
              className="group flex flex-col rounded-xl overflow-hidden shadow-sm border border-ui-border-base transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                backgroundColor: card.backgroundColor || '#ffffff'
              }}
            >
              {/* Image Container */}
              <div className="relative aspect-[3/2] overflow-hidden bg-ui-bg-base-subtle">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ui-fg-muted">
                    No Image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6 md:p-8">
                <h3 
                  className="text-xl font-bold mb-3 theme-heading"
                  style={{ color: titleColor || undefined }}
                >
                  {card.title}
                </h3>
                <p 
                  className="text-base text-ui-fg-subtle mb-6 flex-1 theme-text"
                  style={{ color: textColor || undefined }}
                >
                  {card.description}
                </p>
                
                {card.ctaText && (
                  <div className="mt-auto pt-4">
                     {/* If it's a link, use InteractiveLink or Button */}
                     <a 
                        href={card.ctaLink || "#"}
                        className="inline-flex items-center text-sm font-semibold text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors uppercase tracking-wide"
                     >
                       {card.ctaText}
                       <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                     </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  },
}
