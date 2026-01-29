import { MedusaService } from "@medusajs/framework/utils"
import ThemeSettings from "./models/theme-settings"

class ThemeSettingsModuleService extends MedusaService({
  ThemeSettings,
}) {}

export default ThemeSettingsModuleService
