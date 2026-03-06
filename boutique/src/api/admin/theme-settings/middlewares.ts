import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "zod"

export const UpdateThemeSettingsSchema = z.object({
  store_id: z.string().nullish(),
  logo_url: z.string().url().nullish(),
  favicon_url: z.string().url().nullish(),
  store_name: z.string().max(200).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  text_muted_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  heading_font: z.string().max(100).optional(),
  body_font: z.string().max(100).optional(),
  product_template_variant: z.enum(["classique", "galerie", "immersif"]).optional(),
  button_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  button_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  button_border_radius: z.string().max(20).optional(),
  instagram_url: z.string().url().nullish(),
  facebook_url: z.string().url().nullish(),
  linkedin_url: z.string().url().nullish(),
  tiktok_url: z.string().url().nullish(),
  pinterest_url: z.string().url().nullish(),
  google_business_url: z.string().url().nullish(),
  show_out_of_stock: z.boolean().optional(),
  enable_back_in_stock_alerts: z.boolean().optional(),
  show_product_recommendations: z.boolean().optional(),
  show_new_tag: z.boolean().optional(),
  show_low_stock: z.boolean().optional(),
  low_stock_threshold: z.number().int().min(1).optional(),
  offer_gift_wrapping: z.boolean().optional(),
  figma_access_token: z.string().max(500).nullish(),
})

export type UpdateThemeSettingsSchema = z.infer<typeof UpdateThemeSettingsSchema>

export const themeSettingsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/theme-settings",
    method: "GET",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/theme-settings",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(UpdateThemeSettingsSchema),
    ],
  },
]
