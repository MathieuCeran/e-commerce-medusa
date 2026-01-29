import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { unpublishCmsPageStep } from "./steps/unpublish-cms-page"

type UnpublishCmsPageWorkflowInput = {
  id: string
}

const unpublishCmsPageWorkflow = createWorkflow(
  "unpublish-cms-page-workflow",
  function (input: UnpublishCmsPageWorkflowInput) {
    const page = unpublishCmsPageStep(input)
    return new WorkflowResponse(page)
  }
)

export default unpublishCmsPageWorkflow
