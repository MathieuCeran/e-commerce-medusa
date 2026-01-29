import ThemeSettingsModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const THEME_SETTINGS_MODULE = "themeSettings"

export default Module(THEME_SETTINGS_MODULE, {
  service: ThemeSettingsModuleService,
})
