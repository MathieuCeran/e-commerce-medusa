import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { URL_REDIRECT_MODULE } from "../../modules/url-redirect"
import UrlRedirectModuleService from "../../modules/url-redirect/service"

export const deleteUrlRedirectStep = createStep(
  "delete-url-redirect",
  async (input: { id: string }, { container }) => {
    const service: UrlRedirectModuleService = container.resolve(URL_REDIRECT_MODULE)
    const existing = await service.retrieveUrlRedirect(input.id)
    await service.deleteUrlRedirects(input.id)
    return new StepResponse(undefined, existing)
  },
  async (previousData, { container }) => {
    if (!previousData) return
    const service: UrlRedirectModuleService = container.resolve(URL_REDIRECT_MODULE)
    await service.createUrlRedirects(previousData as Record<string, unknown>)
  }
)
