import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_PAGE_MODULE } from "../../modules/cms-page"
import CmsPageModuleService from "../../modules/cms-page/service"

type UpdateCmsPageStepInput = {
  id: string
  slug?: string
  title?: string
  store_id?: string | null
  seo_meta_title?: string | null
  seo_meta_description?: string | null
  seo_og_image_url?: string | null
  content?: Record<string, unknown>
  parent_id?: string | null
  position?: number
}

export const updateCmsPageStep = createStep(
  "update-cms-page",
  async (input: UpdateCmsPageStepInput, { container }) => {
    const cmsPageService: CmsPageModuleService =
      container.resolve(CMS_PAGE_MODULE)

    // Get current state for rollback
    const existing = await cmsPageService.retrieveCmsPage(input.id)

    // If slug is changing, check uniqueness within the same parent
    if (input.slug && input.slug !== existing.slug) {
      const targetParentId = input.parent_id !== undefined ? input.parent_id : existing.parent_id
      const [conflict] = await cmsPageService.listCmsPages({
        slug: input.slug,
        parent_id: targetParentId || null,
        ...(existing.store_id ? { store_id: existing.store_id } : {}),
      })

      if (conflict) {
        throw new Error(`A page with slug "${input.slug}" already exists under this parent.`)
      }
    }

    const { id, ...updateData } = input
    const updated = await cmsPageService.updateCmsPages({
      id,
      ...updateData,
    })

    return new StepResponse(updated, {
      id: existing.id,
      slug: existing.slug,
      title: existing.title,
      seo_meta_title: existing.seo_meta_title,
      seo_meta_description: existing.seo_meta_description,
      seo_og_image_url: existing.seo_og_image_url,
      content: existing.content,
      parent_id: existing.parent_id,
      position: existing.position,
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
