import { defineMiddlewares } from "@medusajs/framework/http"
import { adminCmsPagesMiddlewares } from "./admin/cms-pages/middlewares"
import { themeSettingsMiddlewares } from "./admin/theme-settings/middlewares"
import { productImportMiddlewares } from "./admin/custom/product-import/middlewares"

export default defineMiddlewares({
  routes: [
    ...adminCmsPagesMiddlewares,
    ...themeSettingsMiddlewares,
    ...productImportMiddlewares,
  ],
})
