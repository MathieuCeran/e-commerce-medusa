import { model } from "@medusajs/framework/utils"

const ThemeSettings = model.define("theme_settings", {
  id: model.id().primaryKey(),
  store_id: model.text().nullable(),

  // Branding
  logo_url: model.text().nullable(),
  favicon_url: model.text().nullable(),
  store_name: model.text().default("My Store"),

  // Colors
  primary_color: model.text().default("#000000"),
  secondary_color: model.text().default("#ffffff"),
  accent_color: model.text().default("#3b82f6"),
  background_color: model.text().default("#ffffff"),
  text_color: model.text().default("#111827"),
  text_muted_color: model.text().default("#6b7280"),

  // Typography
  heading_font: model.text().default("Inter"),
  body_font: model.text().default("Inter"),

  // Header/Footer
  header_variant: model.text().default("one"),
  footer_variant: model.text().default("one"),
  header_bg_color: model.text().default("#ffffff"),
  header_text_color: model.text().default("#111827"),
  footer_bg_color: model.text().default("#111827"),
  footer_text_color: model.text().default("#ffffff"),

  // Buttons
  button_bg_color: model.text().default("#000000"),
  button_text_color: model.text().default("#ffffff"),
  button_border_radius: model.text().default("4px"),
})

export default ThemeSettings
