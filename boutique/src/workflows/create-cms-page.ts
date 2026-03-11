import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCmsPageStep } from "./steps/create-cms-page"

type CreateCmsPageWorkflowInput = {
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

const createCmsPageWorkflow = createWorkflow(
  "create-cms-page-workflow",
  function (input: CreateCmsPageWorkflowInput) {
    const page = createCmsPageStep(input)
    return new WorkflowResponse(page)
  }
)

export default createCmsPageWorkflow
