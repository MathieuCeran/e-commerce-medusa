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

  // Product Page Template
  product_template_variant: model.text().default("classique"),

  // Buttons
  button_bg_color: model.text().default("#000000"),
  button_text_color: model.text().default("#ffffff"),
  button_border_radius: model.text().default("4px"),

  // Social Media
  instagram_url: model.text().nullable(),
  facebook_url: model.text().nullable(),
  linkedin_url: model.text().nullable(),
  tiktok_url: model.text().nullable(),
  pinterest_url: model.text().nullable(),
  google_business_url: model.text().nullable(),

  // Store Settings
  show_out_of_stock: model.boolean().default(false),
  enable_back_in_stock_alerts: model.boolean().default(false),
  show_product_recommendations: model.boolean().default(true),
  show_new_tag: model.boolean().default(true),
  show_low_stock: model.boolean().default(false),
  low_stock_threshold: model.number().default(5),
  offer_gift_wrapping: model.boolean().default(false),

  // Integrations
  figma_access_token: model.text().nullable(),
})

export default ThemeSettings
