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
  header_variant?: string
  footer_variant?: string
  product_template_variant?: string
  header_bg_color?: string
  header_text_color?: string
  footer_bg_color?: string
  footer_text_color?: string
  button_bg_color?: string
  button_text_color?: string
  button_border_radius?: string
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
    header_variant: body.header_variant,
    footer_variant: body.footer_variant,
    product_template_variant: body.product_template_variant,
    header_bg_color: body.header_bg_color,
    header_text_color: body.header_text_color,
    footer_bg_color: body.footer_bg_color,
    footer_text_color: body.footer_text_color,
    button_bg_color: body.button_bg_color,
    button_text_color: body.button_text_color,
    button_border_radius: body.button_border_radius,
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
