import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { THEME_SETTINGS_MODULE } from "../../../modules/theme-settings"
import ThemeSettingsModuleService from "../../../modules/theme-settings/service"

// GET /store/theme-settings — public access to theme settings
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const themeService: ThemeSettingsModuleService =
    req.scope.resolve(THEME_SETTINGS_MODULE)

  const storeId = (req.query.store_id as string) || null

  const [settings] = await themeService.listThemeSettings({
    ...(storeId ? { store_id: storeId } : {}),
  })

  if (!settings) {
    // Return defaults if no settings exist
    res.json({
      settings: {
        store_name: "My Store",
        primary_color: "#000000",
        secondary_color: "#ffffff",
        accent_color: "#3b82f6",
        background_color: "#ffffff",
        text_color: "#111827",
        text_muted_color: "#6b7280",
        heading_font: "Inter",
        body_font: "Inter",
        header_variant: "one",
        footer_variant: "one",
        product_template_variant: "classique",
        header_bg_color: "#ffffff",
        header_text_color: "#111827",
        footer_bg_color: "#111827",
        footer_text_color: "#ffffff",
        button_bg_color: "#000000",
        button_text_color: "#ffffff",
        button_border_radius: "4px",
        instagram_url: null,
        facebook_url: null,
        linkedin_url: null,
        tiktok_url: null,
        pinterest_url: null,
        google_business_url: null,
        show_out_of_stock: false,
        enable_back_in_stock_alerts: false,
        show_product_recommendations: true,
        show_new_tag: true,
        show_low_stock: false,
        low_stock_threshold: 5,
        offer_gift_wrapping: false,
      },
    })
    return
  }

  res.json({ settings })
}
