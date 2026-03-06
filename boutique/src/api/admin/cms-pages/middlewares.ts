import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "zod"

export const CreateCmsPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  title: z.string().min(1).max(500),
  store_id: z.string().nullish(),
  seo_meta_title: z.string().max(200).nullish(),
  seo_meta_description: z.string().max(500).nullish(),
  seo_og_image_url: z.string().url().max(2000).nullish(),
  noindex: z.boolean().optional(),
  content: z.record(z.unknown()).optional(),
})

export type CreateCmsPageSchema = z.infer<typeof CreateCmsPageSchema>

export const UpdateCmsPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .optional(),
  title: z.string().min(1).max(500).optional(),
  store_id: z.string().nullish(),
  seo_meta_title: z.string().max(200).nullish(),
  seo_meta_description: z.string().max(500).nullish(),
  seo_og_image_url: z.string().url().max(2000).nullish(),
  noindex: z.boolean().optional(),
  content: z.record(z.unknown()).optional(),
})

export type UpdateCmsPageSchema = z.infer<typeof UpdateCmsPageSchema>

export const FigmaImportSchema = z.object({
  figma_url: z.string().url().min(1),
})

export type FigmaImportSchema = z.infer<typeof FigmaImportSchema>

export const adminCmsPagesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/cms-pages/figma-import",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(FigmaImportSchema),
    ],
  },
  {
    matcher: "/admin/cms-pages",
    method: "GET",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(CreateCmsPageSchema),
    ],
  },
  {
    matcher: "/admin/cms-pages/:id",
    method: "GET",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages/:id",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(UpdateCmsPageSchema),
    ],
  },
  {
    matcher: "/admin/cms-pages/:id",
    method: "DELETE",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages/:id/publish",
    method: "POST",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-pages/:id/unpublish",
    method: "POST",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
]
