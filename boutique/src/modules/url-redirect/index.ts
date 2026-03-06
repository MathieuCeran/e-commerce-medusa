import UrlRedirectModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const URL_REDIRECT_MODULE = "urlRedirect"

export default Module(URL_REDIRECT_MODULE, {
  service: UrlRedirectModuleService,
})
