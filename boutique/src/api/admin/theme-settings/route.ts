import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { THEME_SETTINGS_MODULE } from "../../../modules/theme-settings"
import ThemeSettingsModuleService from "../../../modules/theme-settings/service"

type ThemeSettingsBody = {
  store_id?: string | null
  store_name?: string
  logo_url?: string | null
  favicon_url?: string | null
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  background_color?: string
  text_color?: string
  text_muted_color?: string
  heading_font?: string
  body_font?: string
  product_template_variant?: string
  button_bg_color?: string
  button_text_color?: string
  button_border_radius?: string
  instagram_url?: string | null
  facebook_url?: string | null
  linkedin_url?: string | null
  tiktok_url?: string | null
  pinterest_url?: string | null
  google_business_url?: string | null
  show_out_of_stock?: boolean
  enable_back_in_stock_alerts?: boolean
  show_product_recommendations?: boolean
  show_new_tag?: boolean
  show_low_stock?: boolean
  low_stock_threshold?: number
  offer_gift_wrapping?: boolean
  figma_access_token?: string | null
}

// GET /admin/theme-settings — get current theme settings (or create default)
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const themeService: ThemeSettingsModuleService =
    req.scope.resolve(THEME_SETTINGS_MODULE)

  const storeId = (req.query.store_id as string) || null

  // Try to find existing settings
  const [settings] = await themeService.listThemeSettings({
    ...(storeId ? { store_id: storeId } : {}),
  })

  if (settings) {
    res.json({ settings })
    return
  }

  // Create default settings if none exist
  const newSettings = await themeService.createThemeSettings({
    store_id: storeId,
  })

  res.json({ settings: newSettings })
}

// POST /admin/theme-settings — update theme settings
export const POST = async (
  req: AuthenticatedMedusaRequest<ThemeSettingsBody>,
  res: MedusaResponse
) => {
  const themeService: ThemeSettingsModuleService =
    req.scope.resolve(THEME_SETTINGS_MODULE)

  const body = req.body || {}
  const storeId = body.store_id || null

  // Find existing or create
  let [settings] = await themeService.listThemeSettings({
    ...(storeId ? { store_id: storeId } : {}),
  })

  if (!settings) {
    settings = await themeService.createThemeSettings({
      store_id: storeId,
    })
  }

  // Extract only allowed fields (filter out id, created_at, updated_at, deleted_at)
  const updateData: ThemeSettingsBody = {
    store_name: body.store_name,
    logo_url: body.logo_url,
    favicon_url: body.favicon_url,
    primary_color: body.primary_color,
    secondary_color: body.secondary_color,
    accent_color: body.accent_color,
    background_color: body.background_color,
    text_color: body.text_color,
    text_muted_color: body.text_muted_color,
    heading_font: body.heading_font,
    body_font: body.body_font,
    product_template_variant: body.product_template_variant,
    button_bg_color: body.button_bg_color,
    button_text_color: body.button_text_color,
    button_border_radius: body.button_border_radius,
    instagram_url: body.instagram_url,
    facebook_url: body.facebook_url,
    linkedin_url: body.linkedin_url,
    tiktok_url: body.tiktok_url,
    pinterest_url: body.pinterest_url,
    google_business_url: body.google_business_url,
    show_out_of_stock: body.show_out_of_stock,
    enable_back_in_stock_alerts: body.enable_back_in_stock_alerts,
    show_product_recommendations: body.show_product_recommendations,
    show_new_tag: body.show_new_tag,
    show_low_stock: body.show_low_stock,
    low_stock_threshold: body.low_stock_threshold,
    offer_gift_wrapping: body.offer_gift_wrapping,
    figma_access_token: body.figma_access_token,
  }

  // Remove undefined values
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([, v]) => v !== undefined)
  )

  // Update with provided values
  const updated = await themeService.updateThemeSettings({
    id: settings.id,
    ...cleanData,
  })

  res.json({ settings: updated })
}
