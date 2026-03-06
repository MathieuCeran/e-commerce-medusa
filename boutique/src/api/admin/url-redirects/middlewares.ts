import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "zod"

export const CreateUrlRedirectSchema = z.object({
  source_url: z.string().min(1).max(2000),
  target_type: z.enum(["homepage", "cms_page", "product_category", "product"]).default("homepage"),
  target_id: z.string().nullish(),
  target_label: z.string().max(500).nullish(),
  status_code: z.number().default(301),
})

export type CreateUrlRedirectSchema = z.infer<typeof CreateUrlRedirectSchema>

export const CreateUrlRedirectBulkSchema = z.object({
  urls: z.array(z.string().min(1).max(2000)).min(1),
  target_type: z.enum(["homepage", "cms_page", "product_category", "product"]).default("homepage"),
  target_id: z.string().nullish(),
  target_label: z.string().max(500).nullish(),
})

export type CreateUrlRedirectBulkSchema = z.infer<typeof CreateUrlRedirectBulkSchema>

export const UpdateUrlRedirectSchema = z.object({
  source_url: z.string().min(1).max(2000).optional(),
  target_type: z.enum(["homepage", "cms_page", "product_category", "product"]).optional(),
  target_id: z.string().nullish(),
  target_label: z.string().max(500).nullish(),
  status_code: z.number().optional(),
})

export type UpdateUrlRedirectSchema = z.infer<typeof UpdateUrlRedirectSchema>

export const adminUrlRedirectsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/url-redirects",
    method: "GET",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/url-redirects",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(CreateUrlRedirectSchema),
    ],
  },
  {
    matcher: "/admin/url-redirects/bulk",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(CreateUrlRedirectBulkSchema),
    ],
  },
  {
    matcher: "/admin/url-redirects/:id",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(UpdateUrlRedirectSchema),
    ],
  },
  {
    matcher: "/admin/url-redirects/:id",
    method: "DELETE",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
]
