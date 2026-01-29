import { model } from "@medusajs/framework/utils"

const CmsPage = model.define("cms_page", {
  id: model.id().primaryKey(),
  store_id: model.text().nullable(),
  slug: model.text().searchable(),
  status: model.enum(["draft", "published"]).default("draft"),
  title: model.text(),
  seo_meta_title: model.text().nullable(),
  seo_meta_description: model.text().nullable(),
  seo_og_image_url: model.text().nullable(),
  content: model.json().default({}),
  preview_token: model.text().nullable(),
})

export default CmsPage
