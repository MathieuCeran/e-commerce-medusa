import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_PAGE_MODULE } from "../../modules/cms-page"
import CmsPageModuleService from "../../modules/cms-page/service"

type DeleteCmsPageStepInput = {
  id: string
}

export const deleteCmsPageStep = createStep(
  "delete-cms-page",
  async (input: DeleteCmsPageStepInput, { container }) => {
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)

    // Get current state for rollback
    const existing = await cmsPageService.retrieveCmsPage(input.id)

    await cmsPageService.deleteCmsPages(input.id)

    return new StepResponse(undefined, existing)
  },
  async (previousData, { container }) => {
    if (!previousData) return
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)
    await cmsPageService.createCmsPages(previousData as Record<string, unknown>)
  }
)
