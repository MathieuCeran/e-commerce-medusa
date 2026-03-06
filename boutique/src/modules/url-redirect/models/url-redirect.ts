import { model } from "@medusajs/framework/utils"

const UrlRedirect = model.define("url_redirect", {
  id: model.id().primaryKey(),
  source_url: model.text().searchable(),
  target_type: model.enum(["homepage", "cms_page", "product_category", "product"]).default("homepage"),
  target_id: model.text().nullable(),
  target_label: model.text().nullable(),
  status_code: model.number().default(301),
})

export default UrlRedirect
