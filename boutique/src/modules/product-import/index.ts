import ProductImportModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const PRODUCT_IMPORT_MODULE = "productImport"

export default Module(PRODUCT_IMPORT_MODULE, {
  service: ProductImportModuleService,
})
