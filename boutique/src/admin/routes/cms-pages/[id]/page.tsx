import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import grapesjs, { Editor } from "grapesjs"
import GjsEditor from "@grapesjs/react"
import gjsPresetWebpage from "grapesjs-preset-webpage"
import { registerBlocks } from "../../../lib/grapes/blocks"
import { sdk } from "../../../lib/client"
import { Button, Text } from "@medusajs/ui"

type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_og_image_url: string | null
  content: Record<string, unknown>
  preview_token: string | null
  updated_at: string
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: unknown
  gjsStyles?: unknown
}

const CmsPageEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState("")
  const [editorRef, setEditorRef] = useState<Editor | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["cms-page", id],
    queryFn: () =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${id}`),
  })

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${id}`, {
        method: "POST",
        body,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(["cms-page", id], result)
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      setSuccess("Saved!")
      setTimeout(() => setSuccess(""), 2000)
    },
  })

  const publishMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${id}/publish`, {
        method: "POST",
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(["cms-page", id], result)
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      setSuccess("Published!")
      setTimeout(() => setSuccess(""), 2000)
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${id}/unpublish`, {
        method: "POST",
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(["cms-page", id], result)
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      setSuccess("Unpublished!")
      setTimeout(() => setSuccess(""), 2000)
    },
  })

  const handleSave = useCallback(() => {
    if (!editorRef) return

    const content: GjsContent = {
      gjsHtml: editorRef.getHtml(),
      gjsCss: editorRef.getCss(),
      gjsComponents: editorRef.getComponents(),
      gjsStyles: editorRef.getStyle(),
    }

    saveMutation.mutate({ content })
  }, [editorRef, saveMutation])

  const onEditor = useCallback((editor: Editor) => {
    setEditorRef(editor)

    // Register custom blocks
    registerBlocks(editor)

    // Load existing content if available
    const pageContent = data?.page?.content as GjsContent | undefined
    if (pageContent?.gjsComponents) {
      editor.setComponents(pageContent.gjsComponents as any)
      if (pageContent.gjsStyles) {
        editor.setStyle(pageContent.gjsStyles as any)
      }
    } else if (pageContent?.gjsHtml) {
      editor.setComponents(pageContent.gjsHtml)
      if (pageContent.gjsCss) {
        editor.setStyle(pageContent.gjsCss)
      }
    }

    // Add save command
    editor.Commands.add('save-page', {
      run: () => {
        const content: GjsContent = {
          gjsHtml: editor.getHtml(),
          gjsCss: editor.getCss(),
          gjsComponents: editor.getComponents(),
          gjsStyles: editor.getStyle(),
        }
        saveMutation.mutate({ content })
      },
    })

    // Keyboard shortcut: Ctrl+S to save
    editor.Keymaps.add('save', 'ctrl+s', 'save-page')
  }, [data, saveMutation])

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <Text className="text-ui-fg-subtle">Loading editor...</Text>
      </div>
    )
  }

  if (error || !data?.page) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", gap: 16 }}>
        <Text className="text-ui-fg-error">
          {error ? (error as Error).message : "Page not found"}
        </Text>
        <Button size="small" variant="secondary" onClick={() => navigate("/cms-pages")}>
          Back to Pages
        </Button>
      </div>
    )
  }

  const page = data.page

  const storeFrontUrl = typeof window !== "undefined"
    ? (window as any).__MEDUSA_STORE_URL__ || "http://localhost:8000"
    : "http://localhost:8000"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--bg-base, #fff)",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-base, #e5e7eb)",
          background: "var(--bg-base, #fff)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/cms-pages")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--fg-subtle, #6b7280)" }}
          >
            ← Back
          </button>
          <Text size="small" weight="plus">{page.title}</Text>
          <Text size="small" className="text-ui-fg-muted" style={{ fontFamily: "monospace" }}>
            {page.slug === "/" ? "/" : `/page/${page.slug}`}
          </Text>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 12,
              background: page.status === "published" ? "#d1fae5" : "#fef3c7",
              color: page.status === "published" ? "#065f46" : "#92400e",
            }}
          >
            {page.status}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {success && (
            <Text size="small" style={{ color: "#059669" }}>
              {success}
            </Text>
          )}

          <Button
            size="small"
            variant="secondary"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={saveMutation.isPending}
          >
            Save
          </Button>

          {page.preview_token && (
            <a
              href={`${storeFrontUrl}${page.slug === "/" ? "" : `/page/${page.slug}`}/preview?token=${page.preview_token}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button size="small" variant="secondary">
                Preview
              </Button>
            </a>
          )}

          {page.status === "draft" ? (
            <Button
              size="small"
              onClick={() => publishMutation.mutate()}
              isLoading={publishMutation.isPending}
              disabled={publishMutation.isPending}
            >
              Publish
            </Button>
          ) : (
            <Button
              size="small"
              variant="secondary"
              onClick={() => unpublishMutation.mutate()}
              isLoading={unpublishMutation.isPending}
              disabled={unpublishMutation.isPending}
            >
              Unpublish
            </Button>
          )}
        </div>
      </div>

      {/* GrapeJS Editor */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <GjsEditor
          grapesjs={grapesjs}
          grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
          plugins={[gjsPresetWebpage]}
          options={{
            height: "100%",
            storageManager: false,
            canvas: {
              styles: [
                'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
              ],
            },
            deviceManager: {
              devices: [
                { name: 'Desktop', width: '' },
                { name: 'Tablet', width: '768px', widthMedia: '992px' },
                { name: 'Mobile', width: '375px', widthMedia: '480px' },
              ],
            },
          }}
          onEditor={onEditor}
        />
      </div>
    </div>
  )
}

export default CmsPageEditor
