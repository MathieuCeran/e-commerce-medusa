import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_PAGE_MODULE } from "../../modules/cms-page"
import CmsPageModuleService from "../../modules/cms-page/service"
import crypto from "crypto"

type PublishCmsPageStepInput = {
  id: string
}

export const publishCmsPageStep = createStep(
  "publish-cms-page",
  async (input: PublishCmsPageStepInput, { container }) => {
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)

    const existing = await cmsPageService.retrieveCmsPage(input.id)

    const previewToken = crypto.randomBytes(32).toString("hex")

    const updated = await cmsPageService.updateCmsPages({
      id: input.id,
      status: "published",
      preview_token: previewToken,
    })

    return new StepResponse(updated, {
      id: existing.id,
      status: existing.status,
      preview_token: existing.preview_token,
    })
  },
  async (previousData, { container }) => {
    if (!previousData) return
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)
    const { id, ...data } = previousData as Record<string, unknown>
    await cmsPageService.updateCmsPages({ id: id as string, ...data })
  }
)
