import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CMS_PAGE_MODULE } from "../../../../modules/cms-page"
import CmsPageModuleService from "../../../../modules/cms-page/service"
import updateCmsPageWorkflow from "../../../../workflows/update-cms-page"
import deleteCmsPageWorkflow from "../../../../workflows/delete-cms-page"
import type { UpdateCmsPageSchema } from "../middlewares"

// Reserved slugs that cannot be used (except by system pages)
const RESERVED_SLUGS = ["/", "home", "homepage", "accueil", "account", "cart", "categories", "collections", "order", "page", "preview", "products", "store"]

// GET /admin/cms-pages/:id
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const page = await cmsPageService.retrieveCmsPage(req.params.id)

  res.json({ page })
}

// POST /admin/cms-pages/:id — update page
export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateCmsPageSchema>,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const existingPage = await cmsPageService.retrieveCmsPage(req.params.id)

  // Prevent changing slug of system pages (homepage)
  if (existingPage.is_system && req.validatedBody.slug && req.validatedBody.slug !== "/") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot change the slug of the homepage"
    )
  }

  // Prevent using reserved slugs (for non-system pages)
  const newSlug = req.validatedBody.slug?.toLowerCase()
  if (!existingPage.is_system && newSlug && RESERVED_SLUGS.includes(newSlug)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `The slug "${req.validatedBody.slug}" is reserved. Please choose a different slug.`
    )
  }

  // Validate parent_id constraints
  if (req.validatedBody.parent_id !== undefined) {
    if (existingPage.is_system && req.validatedBody.parent_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot make the homepage a sub-page"
      )
    }

    if (req.validatedBody.parent_id) {
      if (req.validatedBody.parent_id === req.params.id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "A page cannot be its own parent"
        )
      }

      const [children] = await cmsPageService.listAndCountCmsPages({
        parent_id: req.params.id,
      })
      if (children.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot make a parent page into a sub-page. Remove its children first."
        )
      }

      const parent = await cmsPageService.retrieveCmsPage(req.validatedBody.parent_id)

      if (parent.parent_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest a page under a sub-page (max depth = 1)"
        )
      }

      if (parent.is_system) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot nest a page under the homepage"
        )
      }
    }
  }

  const { result: page } = await updateCmsPageWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.json({ page })
}

// DELETE /admin/cms-pages/:id
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const cmsPageService: CmsPageModuleService =
    req.scope.resolve(CMS_PAGE_MODULE)

  const page = await cmsPageService.retrieveCmsPage(req.params.id)

  // Prevent deletion of system pages (homepage)
  if (page.is_system) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot delete system pages (homepage)"
    )
  }

  // Promote children to root level before deleting
  const [children] = await cmsPageService.listAndCountCmsPages({
    parent_id: req.params.id,
  })

  if (children.length > 0) {
    const [rootPages] = await cmsPageService.listAndCountCmsPages(
      { parent_id: null },
      { order: { position: "DESC" }, take: 1 }
    )
    let nextPosition = rootPages.length > 0 ? (rootPages[0] as any).position + 1 : 0

    for (const child of children) {
      await cmsPageService.updateCmsPages({
        id: child.id,
        parent_id: null,
        position: nextPosition++,
      })
    }
  }

  await deleteCmsPageWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json({ id: req.params.id, deleted: true })
}
