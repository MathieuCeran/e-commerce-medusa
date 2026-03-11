import { model } from "@medusajs/framework/utils"

const CmsLayout = model.define("cms_layout", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  html: model.text().default(""),
  css: model.text().default(""),
  component_data: model.json().default([]),
  content_position: model.number().default(-1),
  is_default: model.boolean().default(false),
})

export default CmsLayout
