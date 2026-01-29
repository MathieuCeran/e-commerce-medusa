import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { publishCmsPageStep } from "./steps/publish-cms-page"

type PublishCmsPageWorkflowInput = {
  id: string
}

const publishCmsPageWorkflow = createWorkflow(
  "publish-cms-page-workflow",
  function (input: PublishCmsPageWorkflowInput) {
    const page = publishCmsPageStep(input)
    return new WorkflowResponse(page)
  }
)

export default publishCmsPageWorkflow
