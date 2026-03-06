import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Container, Heading, Text, Button, Label, Input, Switch } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { sdk } from "../../lib/client"

type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  noindex: boolean
  updated_at: string
  is_system: boolean
}

const getDisplayUrl = (page: CmsPage) => {
  if (page.slug === "/" || page.is_system) {
    return "/"
  }
  return `/page/${page.slug}`
}

const EditPageModal = ({
  page,
  onClose,
}: {
  page: CmsPage
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState(page.slug)
  const [title, setTitle] = useState(page.title)
  const [seoTitle, setSeoTitle] = useState(page.seo_meta_title || "")
  const [seoDescription, setSeoDescription] = useState(page.seo_meta_description || "")
  const [noindex, setNoindex] = useState(page.noindex ?? false)

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${page.id}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      ...(page.is_system ? {} : { slug }),
      title,
      seo_meta_title: seoTitle || null,
      seo_meta_description: seoDescription || null,
      noindex,
    })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: "var(--bg-base, #fff)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-base, #e5e7eb)",
            }}
          >
            <Heading level="h2">Modifier la page</Heading>
          </div>

          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <Label size="small">Titre</Label>
              <Input
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {!page.is_system && (
              <div>
                <Label size="small">Slug</Label>
                <Input
                  size="small"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  required
                />
                <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                  URL : /page/{slug}
                </Text>
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid var(--border-base, #e5e7eb)",
                paddingTop: 16,
              }}
            >
              <Text size="small" weight="plus" className="mb-3">
                SEO
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <Label size="small">Balise Title</Label>
                  <Input
                    size="small"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Titre pour les moteurs de recherche"
                  />
                  <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                    {seoTitle.length}/60 caracteres
                  </Text>
                </div>
                <div>
                  <Label size="small">Meta Description</Label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Description pour les moteurs de recherche"
                    rows={3}
                    className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm resize-none"
                  />
                  <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                    {seoDescription.length}/160 caracteres
                  </Text>
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
                <div>
                  <Label size="small">Ne pas indexer cette page</Label>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Ajoute la balise noindex pour les moteurs de recherche
                  </Text>
                </div>
                <Switch size="small" checked={noindex} onCheckedChange={setNoindex} />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-base, #e5e7eb)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button size="small" variant="secondary" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button
              size="small"
              type="submit"
              isLoading={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Enregistrer
            </Button>
          </div>

          {updateMutation.isError && (
            <div style={{ padding: "0 24px 16px" }}>
              <Text size="small" className="text-ui-fg-error">
                {(updateMutation.error as Error).message}
              </Text>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

const CmsPagesList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null)

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
          {[...pages]
            .sort((a, b) => {
              if (a.is_system && !b.is_system) return -1
              if (!a.is_system && b.is_system) return 1
              return a.title.localeCompare(b.title)
            })
            .map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-ui-bg-base-hover cursor-pointer"
              onClick={() => navigate(`/cms-pages/${page.id}`)}
            >
              <div>
                <Text size="small" weight="plus">
                  {page.title}
                  {page.is_system && (
                    <span className="ml-2 text-xs text-ui-fg-muted">(Homepage)</span>
                  )}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {getDisplayUrl(page)}
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
                    setEditingPage(page)
                  }}
                >
                  Edit
                </Button>
                {!page.is_system && (
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPage && (
        <EditPageModal
          page={editingPage}
          onClose={() => setEditingPage(null)}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "CMS Pages",
  icon: DocumentText,
})

export default CmsPagesList
