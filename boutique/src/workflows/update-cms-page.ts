import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateCmsPageStep } from "./steps/update-cms-page"

type UpdateCmsPageWorkflowInput = {
  id: string
  slug?: string
  title?: string
  store_id?: string | null
  seo_meta_title?: string | null
  seo_meta_description?: string | null
  seo_og_image_url?: string | null
  content?: Record<string, unknown>
}

const updateCmsPageWorkflow = createWorkflow(
  "update-cms-page-workflow",
  function (input: UpdateCmsPageWorkflowInput) {
    const page = updateCmsPageStep(input)
    return new WorkflowResponse(page)
  }
)

export default updateCmsPageWorkflow
