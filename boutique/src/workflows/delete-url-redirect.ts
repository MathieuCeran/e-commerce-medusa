import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteUrlRedirectStep } from "./steps/delete-url-redirect"

const deleteUrlRedirectWorkflow = createWorkflow(
  "delete-url-redirect-workflow",
  function (input: { id: string }) {
    deleteUrlRedirectStep(input)
    return new WorkflowResponse(undefined)
  }
)

export default deleteUrlRedirectWorkflow
