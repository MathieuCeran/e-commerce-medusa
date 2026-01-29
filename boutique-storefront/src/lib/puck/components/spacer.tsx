import type { ComponentConfig } from "@puckeditor/core"

export type SpacerProps = {
  height: number
  showDivider: boolean
  dividerColor: string
  dividerWidth: "narrow" | "medium" | "wide" | "full"
  backgroundColor: string
}

export const Spacer: ComponentConfig<SpacerProps> = {
  label: "Spacer / Divider",
  fields: {
    height: {
      type: "number",
      label: "Height (px)",
      min: 0,
      max: 300,
    },
    showDivider: {
      type: "radio",
      label: "Show Divider Line",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    dividerColor: { type: "text", label: "Divider Color (hex)" },
    dividerWidth: {
      type: "select",
      label: "Divider Width",
      options: [
        { label: "Narrow (200px)", value: "narrow" },
        { label: "Medium (400px)", value: "medium" },
        { label: "Wide (600px)", value: "wide" },
        { label: "Full Width", value: "full" },
      ],
    },
    backgroundColor: { type: "text", label: "Background Color (hex)" },
  },
  defaultProps: {
    height: 48,
    showDivider: false,
    dividerColor: "#e5e7eb",
    dividerWidth: "full",
    backgroundColor: "transparent",
  },
  render: ({ height, showDivider, dividerColor, dividerWidth, backgroundColor }) => {
    const widthClasses = {
      narrow: "max-w-[200px]",
      medium: "max-w-[400px]",
      wide: "max-w-[600px]",
      full: "",
    }

    return (
      <div
        className="flex items-center justify-center"
        style={{
          height,
          backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
        }}
      >
        {showDivider && (
          <hr
            className={`w-full ${widthClasses[dividerWidth]} mx-6`}
            style={{ borderColor: dividerColor, borderTopWidth: 1 }}
          />
        )}
      </div>
    )
  },
}
