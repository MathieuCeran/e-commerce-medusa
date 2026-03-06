import { defineMiddlewares } from "@medusajs/framework/http"
import { adminCmsPagesMiddlewares } from "./admin/cms-pages/middlewares"
import { adminCmsLayoutsMiddlewares } from "./admin/cms-layouts/middlewares"
import { themeSettingsMiddlewares } from "./admin/theme-settings/middlewares"
import { productImportMiddlewares } from "./admin/custom/product-import/middlewares"
import { adminUrlRedirectsMiddlewares } from "./admin/url-redirects/middlewares"

export default defineMiddlewares({
  routes: [
    ...adminCmsPagesMiddlewares,
    ...adminCmsLayoutsMiddlewares,
    ...themeSettingsMiddlewares,
    ...productImportMiddlewares,
    ...adminUrlRedirectsMiddlewares,
  ],
})
