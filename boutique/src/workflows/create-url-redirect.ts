import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createUrlRedirectStep } from "./steps/create-url-redirect"

type CreateUrlRedirectWorkflowInput = {
  source_url: string
  target_type?: string
  target_id?: string | null
  target_label?: string | null
  status_code?: number
}

const createUrlRedirectWorkflow = createWorkflow(
  "create-url-redirect-workflow",
  function (input: CreateUrlRedirectWorkflowInput) {
    const redirect = createUrlRedirectStep(input)
    return new WorkflowResponse(redirect)
  }
)

export default createUrlRedirectWorkflow
