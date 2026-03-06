import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { URL_REDIRECT_MODULE } from "../../modules/url-redirect"
import UrlRedirectModuleService from "../../modules/url-redirect/service"

type UpdateUrlRedirectStepInput = {
  id: string
  source_url?: string
  target_type?: string
  target_id?: string | null
  target_label?: string | null
  status_code?: number
}

export const updateUrlRedirectStep = createStep(
  "update-url-redirect",
  async (input: UpdateUrlRedirectStepInput, { container }) => {
    const service: UrlRedirectModuleService = container.resolve(URL_REDIRECT_MODULE)
    const existing = await service.retrieveUrlRedirect(input.id)
    const { id, ...updateData } = input
    const updated = await service.updateUrlRedirects({ id, ...updateData })
    return new StepResponse(updated, {
      id: existing.id,
      source_url: existing.source_url,
      target_type: existing.target_type,
      target_id: existing.target_id,
      target_label: existing.target_label,
      status_code: existing.status_code,
    })
  },
  async (previousData, { container }) => {
    if (!previousData) return
    const service: UrlRedirectModuleService = container.resolve(URL_REDIRECT_MODULE)
    const { id, ...data } = previousData as Record<string, unknown>
    await service.updateUrlRedirects({ id: id as string, ...data })
  }
)
