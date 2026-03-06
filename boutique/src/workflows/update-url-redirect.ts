import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateUrlRedirectStep } from "./steps/update-url-redirect"

type UpdateUrlRedirectWorkflowInput = {
  id: string
  source_url?: string
  target_type?: string
  target_id?: string | null
  target_label?: string | null
  status_code?: number
}

const updateUrlRedirectWorkflow = createWorkflow(
  "update-url-redirect-workflow",
  function (input: UpdateUrlRedirectWorkflowInput) {
    const redirect = updateUrlRedirectStep(input)
    return new WorkflowResponse(redirect)
  }
)

export default updateUrlRedirectWorkflow
