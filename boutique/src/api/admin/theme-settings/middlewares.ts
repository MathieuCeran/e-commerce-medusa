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
  header_variant: z.string().max(100).optional(),
  footer_variant: z.string().max(100).optional(),
  header_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  header_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  footer_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  footer_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  button_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  button_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  button_border_radius: z.string().max(20).optional(),
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
