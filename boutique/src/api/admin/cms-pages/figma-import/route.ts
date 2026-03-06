import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { THEME_SETTINGS_MODULE } from "../../../../modules/theme-settings"
import ThemeSettingsModuleService from "../../../../modules/theme-settings/service"
import { figmaToHtml } from "./figma-to-html"

import type { FigmaImportSchema } from "../middlewares"

// POST /admin/cms-pages/figma-import
export const POST = async (
  req: AuthenticatedMedusaRequest<FigmaImportSchema>,
  res: MedusaResponse
) => {
  const { figma_url } = req.validatedBody

  if (!figma_url) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "figma_url is required"
    )
  }

  // Get Figma token from theme settings
  const themeService: ThemeSettingsModuleService =
    req.scope.resolve(THEME_SETTINGS_MODULE)

  const [settings] = await themeService.listThemeSettings({})

  const token = settings?.figma_access_token
  if (!token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Figma access token non configure. Allez dans Theme Settings > Integrations pour le configurer."
    )
  }

  try {
    const result = await figmaToHtml(figma_url, token)
    res.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'import Figma"
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }
}
