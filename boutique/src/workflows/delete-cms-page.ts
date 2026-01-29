import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteCmsPageStep } from "./steps/delete-cms-page"

type DeleteCmsPageWorkflowInput = {
  id: string
}

const deleteCmsPageWorkflow = createWorkflow(
  "delete-cms-page-workflow",
  function (input: DeleteCmsPageWorkflowInput) {
    deleteCmsPageStep(input)
    return new WorkflowResponse(undefined)
  }
)

export default deleteCmsPageWorkflow
