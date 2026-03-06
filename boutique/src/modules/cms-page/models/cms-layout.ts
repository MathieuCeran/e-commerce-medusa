import { model } from "@medusajs/framework/utils"

const CmsLayout = model.define("cms_layout", {
  id: model.id().primaryKey(),
  name: model.text(),
  html: model.text().default(""),
  css: model.text().default(""),
  component_data: model.json().default([]),
})

export default CmsLayout
