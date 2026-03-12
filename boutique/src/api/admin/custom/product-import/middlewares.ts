import { MiddlewareRoute } from "@medusajs/framework/http"
import { z } from "zod"
import multer from "multer"

/**
 * Multer configuration for file upload
 * - Memory storage (file in buffer)
 * - Max 10MB file size
 * - Only accept CSV files
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["text/csv", "application/csv", "text/plain"]
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Type de fichier invalide: ${file.mimetype}`), false)
    }
  },
})

/**
 * Schema for transform endpoint (file only)
 */
export const TransformBodySchema = z.object({})
export type TransformBodySchema = z.infer<typeof TransformBodySchema>

/**
 * Schema for transform-and-import endpoint (file only)
 */
export const TransformAndImportBodySchema = z.object({})
export type TransformAndImportBodySchema = z.infer<typeof TransformAndImportBodySchema>

/**
 * Middleware configuration for product import routes
 */
export const productImportMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/custom/product-import/transform",
    method: "POST",
    middlewares: [upload.single("file")],
  },
  {
    matcher: "/admin/custom/product-import/transform-and-import",
    method: "POST",
    middlewares: [upload.single("file")],
  },
]
