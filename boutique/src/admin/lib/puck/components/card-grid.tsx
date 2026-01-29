import { ComponentConfig } from "@puckeditor/core"

export type CardItem = {
  imageUrl: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  backgroundColor: string
  animation?: "none" | "fade" | "slide-up" | "slide-left" | "slide-right"
}

export type CardGridProps = {
  cards: CardItem[]
  columns: "2" | "3" | "4"
  backgroundColor: string
  titleColor: string
  textColor: string
  paddingTop: number
  paddingBottom: number
  animation: "none" | "fade" | "slide-up" | "slide-left" | "slide-right"
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
      defaultItemProps: {
        imageUrl: "https://placehold.co/600x400",
        title: "Card Title",
        description: "Short description for this card.",
        ctaText: "Learn More",
        ctaLink: "#",
        backgroundColor: "#ffffff",
        animation: "none",
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
    animation: {
      type: "select",
      label: "Section Animation",
      options: [
        { label: "None", value: "none" },
        { label: "Fade In", value: "fade" },
        { label: "Slide Up", value: "slide-up" },
        { label: "Slide Left", value: "slide-left" },
        { label: "Slide Right", value: "slide-right" },
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
    animation: "none",
  },
  render: ({
    cards,
    columns,
    backgroundColor,
    titleColor,
    textColor,
    paddingTop,
    paddingBottom,
    animation,
  }) => {
    return (
      <div
        style={{
          backgroundColor: backgroundColor || "#ffffff",
          paddingTop,
          paddingBottom,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 24,
          }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                backgroundColor: card.backgroundColor || "#fff",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ height: 200, backgroundColor: "#f3f4f6" }}>
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>
              <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: titleColor || "#111827",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: textColor || "#4B5563",
                    marginBottom: 16,
                    flex: 1,
                  }}
                >
                  {card.description}
                </p>
                {card.ctaText && (
                  <div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#4f46e5", // Indigo-600
                        textDecoration: "none",
                      }}
                    >
                      {card.ctaText} &rarr;
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
