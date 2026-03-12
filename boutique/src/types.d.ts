/**
 * Global module declarations for packages without bundled type definitions.
 */

declare module "multer" {
  import type { RequestHandler } from "express"

  interface File {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    size: number
    buffer: Buffer
    [key: string]: unknown
  }

  interface StorageEngine {
    _handleFile(
      req: unknown,
      file: unknown,
      callback: (error?: unknown, info?: unknown) => void
    ): void
    _removeFile(
      req: unknown,
      file: unknown,
      callback: (error: unknown) => void
    ): void
  }

  interface Options {
    storage?: StorageEngine
    limits?: {
      fileSize?: number
      files?: number
      [key: string]: unknown
    }
    fileFilter?: (
      req: unknown,
      file: File,
      callback: (error: Error | null, acceptFile: boolean) => void
    ) => void
  }

  interface Multer {
    single(fieldname: string): RequestHandler
    array(fieldname: string, maxCount?: number): RequestHandler
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler
    none(): RequestHandler
  }

  interface MulterStatic {
    (options?: Options): Multer
    memoryStorage(): StorageEngine
  }

  const multer: MulterStatic
  export = multer
}
