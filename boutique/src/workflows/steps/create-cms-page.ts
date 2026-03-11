import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_PAGE_MODULE } from "../../modules/cms-page"
import CmsPageModuleService from "../../modules/cms-page/service"

type CreateCmsPageStepInput = {
  slug: string
  title: string
  store_id?: string | null
  seo_meta_title?: string | null
  seo_meta_description?: string | null
  seo_og_image_url?: string | null
  content?: Record<string, unknown>
  parent_id?: string | null
  position?: number
}

export const createCmsPageStep = createStep(
  "create-cms-page",
  async (input: CreateCmsPageStepInput, { container }) => {
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)

    // Check slug uniqueness within the same parent
    const [existing] = await cmsPageService.listCmsPages({
      slug: input.slug,
      parent_id: input.parent_id || null,
      ...(input.store_id ? { store_id: input.store_id } : {}),
    })

    if (existing) {
      throw new Error(`A page with slug "${input.slug}" already exists.`)
    }

    const page = await cmsPageService.createCmsPages({
      ...input,
      status: "draft",
    })

    return new StepResponse(page, page.id)
  },
  async (id, { container }) => {
    if (!id) return
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)
    await cmsPageService.deleteCmsPages(id)
  }
)
