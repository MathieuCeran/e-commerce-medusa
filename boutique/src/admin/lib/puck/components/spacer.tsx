import { ComponentConfig } from "@puckeditor/core"

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
    const widthMap = {
      narrow: 200,
      medium: 400,
      wide: 600,
      full: "100%",
    }

    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: backgroundColor === "transparent" ? undefined : backgroundColor,
        }}
      >
        {showDivider && (
          <hr
            style={{
              width: widthMap[dividerWidth],
              maxWidth: "calc(100% - 48px)",
              border: "none",
              borderTop: `1px solid ${dividerColor}`,
              margin: 0,
            }}
          />
        )}
      </div>
    )
  },
}
