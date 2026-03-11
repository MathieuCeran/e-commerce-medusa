import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "zod"

export const CreateCmsLayoutSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})
export type CreateCmsLayoutSchema = z.infer<typeof CreateCmsLayoutSchema>

export const UpdateCmsLayoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  component_data: z.array(z.any()).optional(),
  css: z.string().optional(),
  html: z.string().optional(),
  content_position: z.number().int().min(-1).optional(),
})
export type UpdateCmsLayoutSchema = z.infer<typeof UpdateCmsLayoutSchema>

const auth = authenticate("user", ["session", "bearer"])

export const adminCmsLayoutsMiddlewares: MiddlewareRoute[] = [
  { matcher: "/admin/cms-layouts", method: "GET", middlewares: [auth] },
  {
    matcher: "/admin/cms-layouts",
    method: "POST",
    middlewares: [auth, validateAndTransformBody(CreateCmsLayoutSchema)],
  },
  { matcher: "/admin/cms-layouts/:id", method: "GET", middlewares: [auth] },
  {
    matcher: "/admin/cms-layouts/:id",
    method: "POST",
    middlewares: [auth, validateAndTransformBody(UpdateCmsLayoutSchema)],
  },
  { matcher: "/admin/cms-layouts/:id", method: "DELETE", middlewares: [auth] },
  {
    matcher: "/admin/cms-layouts/:id/set-default",
    method: "POST",
    middlewares: [auth],
  },
]
