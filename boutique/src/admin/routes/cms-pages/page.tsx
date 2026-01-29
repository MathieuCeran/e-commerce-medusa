import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { sdk } from "../../lib/client"

type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  updated_at: string
}

const CmsPagesList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [newTitle, setNewTitle] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: () =>
      sdk.client.fetch<{ pages: CmsPage[]; count: number }>(
        "/admin/cms-pages"
      ),
  })

  const createMutation = useMutation({
    mutationFn: (body: { slug: string; title: string; content: Record<string, unknown> }) =>
      sdk.client.fetch<{ page: CmsPage }>("/admin/cms-pages", {
        method: "POST",
        body,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      setShowCreate(false)
      setNewSlug("")
      setNewTitle("")
      navigate(`/cms-pages/${result.page.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/cms-pages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      slug: newSlug,
      title: newTitle,
      content: { content: [], root: { props: {} } },
    })
  }

  const pages = data?.pages ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">CMS Pages</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Manage marketing pages with the visual editor
          </Text>
        </div>
        <Button size="small" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Page"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="px-6 py-4 bg-ui-bg-subtle">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Text size="small" weight="plus" className="mb-1">
                Slug
              </Text>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="about-us"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <Text size="small" weight="plus" className="mb-1">
                Title
              </Text>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="About Us"
                required
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm"
              />
            </div>
            <Button
              size="small"
              type="submit"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Create
            </Button>
          </div>
          {createMutation.isError && (
            <Text size="small" className="text-ui-fg-error mt-2">
              {(createMutation.error as Error).message}
            </Text>
          )}
        </form>
      )}

      {isLoading ? (
        <div className="px-6 py-8 text-center">
          <Text size="small" className="text-ui-fg-subtle">
            Loading pages...
          </Text>
        </div>
      ) : pages.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text size="small" className="text-ui-fg-subtle">
            No pages yet. Create your first page.
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-ui-bg-base-hover cursor-pointer"
              onClick={() => navigate(`/cms-pages/${page.id}`)}
            >
              <div>
                <Text size="small" weight="plus">
                  {page.title}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  /p/{page.slug}
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    page.status === "published"
                      ? "bg-ui-tag-green-bg text-ui-tag-green-text"
                      : "bg-ui-tag-orange-bg text-ui-tag-orange-text"
                  }`}
                >
                  {page.status}
                </span>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm("Delete this page?")) {
                      deleteMutation.mutate(page.id)
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "CMS Pages",
  icon: DocumentText,
})

export default CmsPagesList
