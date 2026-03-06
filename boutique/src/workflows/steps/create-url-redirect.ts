import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { URL_REDIRECT_MODULE } from "../../modules/url-redirect"
import UrlRedirectModuleService from "../../modules/url-redirect/service"

type CreateUrlRedirectStepInput = {
  source_url: string
  target_type?: string
  target_id?: string | null
  target_label?: string | null
  status_code?: number
}

export const createUrlRedirectStep = createStep(
  "create-url-redirect",
  async (input: CreateUrlRedirectStepInput, { container }) => {
    const service: UrlRedirectModuleService = container.resolve(URL_REDIRECT_MODULE)
    const redirect = await service.createUrlRedirects(input)
    return new StepResponse(redirect, redirect.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service: UrlRedirectModuleService = container.resolve(URL_REDIRECT_MODULE)
    await service.deleteUrlRedirects(id)
  }
)
