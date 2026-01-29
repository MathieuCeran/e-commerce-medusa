import CmsPageModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const CMS_PAGE_MODULE = "cmsPage"

export default Module(CMS_PAGE_MODULE, {
  service: CmsPageModuleService,
})
