import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "zod"

export const UpsertCmsLayoutSchema = z.object({
  type: z.enum(["header", "footer"]),
  html: z.string().default(""),
  css: z.string().default(""),
  component_data: z.record(z.unknown()).default({}),
})

export type UpsertCmsLayoutSchema = z.infer<typeof UpsertCmsLayoutSchema>

export const adminCmsLayoutsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/cms-layouts",
    method: "GET",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    matcher: "/admin/cms-layouts",
    method: "POST",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(UpsertCmsLayoutSchema),
    ],
  },
  {
    matcher: "/admin/cms-layouts/:id",
    method: "DELETE",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
]
