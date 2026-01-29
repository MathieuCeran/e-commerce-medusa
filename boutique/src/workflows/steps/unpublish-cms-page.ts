import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_PAGE_MODULE } from "../../modules/cms-page"
import CmsPageModuleService from "../../modules/cms-page/service"

type UnpublishCmsPageStepInput = {
  id: string
}

export const unpublishCmsPageStep = createStep(
  "unpublish-cms-page",
  async (input: UnpublishCmsPageStepInput, { container }) => {
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)

    const existing = await cmsPageService.retrieveCmsPage(input.id)

    const updated = await cmsPageService.updateCmsPages({
      id: input.id,
      status: "draft",
    })

    return new StepResponse(updated, {
      id: existing.id,
      status: existing.status,
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
