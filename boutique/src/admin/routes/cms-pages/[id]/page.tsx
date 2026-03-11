import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useEffect, useRef } from "react"
import grapesjs, { Editor } from "grapesjs"
import GjsEditor from "@grapesjs/react"
import gjsPresetWebpage from "grapesjs-preset-webpage"
import {
  registerBlocks,
  addContentPlaceholder,
  getContentPlaceholderIndex,
} from "../../../lib/grapes/blocks"
import { injectFramerTheme, removeFramerTheme } from "../../../lib/grapes/theme"
import { FramerSidebar } from "../../../lib/grapes/framer-sidebar"
import { sdk } from "../../../lib/client"

// ── Types ────────────────────────────────────────────────

type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_og_image_url: string | null
  content: Record<string, any>
  layout_id: string | null
  preview_token: string | null
  updated_at: string
}

type CmsLayout = {
  id: string
  name: string
  html: string
  css: string
  component_data: any[]
  content_position: number
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: any
  gjsStyles?: any
}

type EditorMode = "page" | "template"

// ── Helpers ──────────────────────────────────────────────

const EDITOR_ONLY_STYLES = new Set([
  "outline", "outline-color", "outline-style", "outline-width", "outline-offset",
])

/** Safely serialize editor CSS rules to plain JSON (avoids toJSON crash on detached components) */
function safeGetStyles(editor: Editor): any {
  try {
    return JSON.parse(JSON.stringify(editor.getStyle()))
  } catch {
    return []
  }
}

function lockComponent(comp: any, isRoot = true) {
  comp.set({
    locked: true,
    selectable: false,
    hoverable: false,
    editable: false,
    draggable: false,
    removable: false,
    copyable: false,
    highlightable: false,
  })
  if (isRoot) {
    comp.set("_tpl", true)
    comp.addAttributes({ "data-tpl-locked": "true" })
  }
  comp.components().forEach((child: any) => lockComponent(child, false))
}

function rebuildPageView(
  editor: Editor,
  layout: CmsLayout | null | undefined,
  pageComponents: any[],
  pageStyles: any
) {
  const wrapper = editor.getWrapper()
  if (!wrapper) return

  wrapper.components().reset()
  editor.setStyle([])

  if (layout?.component_data?.length) {
    const pos =
      layout.content_position >= 0
        ? Math.min(layout.content_position, layout.component_data.length)
        : layout.component_data.length

    // Template before content
    for (let i = 0; i < pos; i++) {
      const added = editor.addComponents(layout.component_data[i])
      if (added?.length) lockComponent(added[0])
    }

    // Page content
    for (const comp of pageComponents) {
      editor.addComponents(comp)
    }

    // Template after content
    for (let i = pos; i < layout.component_data.length; i++) {
      const added = editor.addComponents(layout.component_data[i])
      if (added?.length) lockComponent(added[0])
    }
  } else {
    for (const comp of pageComponents) {
      editor.addComponents(comp)
    }
  }

  if (pageStyles) editor.setStyle(pageStyles)

  // Load layout CSS rules (class-based styles, media queries, etc.)
  if (layout?.css) {
    try { editor.Css.addRules(layout.css) } catch { /* skip */ }
  }
}

function extractPageComponents(editor: Editor): any[] {
  const wrapper = editor.getWrapper()
  if (!wrapper) return []
  return wrapper
    .components()
    .models.filter(
      (c: any) => !c.get("_tpl") && c.get("type") !== "content-placeholder"
    )
    .map((c: any) => c.toJSON())
}

// ── Figma Import Modal ───────────────────────────────────

const FigmaImportModal = ({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (html: string, css: string) => void
}) => {
  const [figmaUrl, setFigmaUrl] = useState("")
  const [error, setError] = useState("")

  const importMutation = useMutation({
    mutationFn: (url: string) =>
      sdk.client.fetch<{ html: string; css: string }>(
        "/admin/cms-pages/figma-import",
        { method: "POST", body: { figma_url: url } }
      ),
    onSuccess: (result) => {
      onImport(result.html, result.css)
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message || "Erreur lors de l'import")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!figmaUrl.includes("figma.com")) {
      setError("Veuillez entrer une URL Figma valide")
      return
    }
    importMutation.mutate(figmaUrl)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: 14,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.12)",
          animation: "figmaModalIn 0.2s ease",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 38 57" fill="none">
                <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE" />
                <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83" />
                <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262" />
                <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E" />
                <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF" />
              </svg>
              <span style={{ color: "#1a1a1a", fontSize: 15, fontWeight: 600 }}>
                Import Figma
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#333" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#bbb" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div style={{ padding: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#777",
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 8,
                letterSpacing: "0.02em",
              }}
            >
              URL FIGMA
            </label>
            <input
              type="url"
              value={figmaUrl}
              onChange={(e) => { setFigmaUrl(e.target.value); setError("") }}
              placeholder="https://www.figma.com/design/xxx/...?node-id=6-79"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#f5f5f5",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                color: "#333",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#0099ff" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e0e0e0" }}
            />
            <p style={{ color: "#999", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
              Collez l'URL d'un frame Figma. Utilisez{" "}
              <strong style={{ color: "#777" }}>node-id</strong> dans l'URL pour
              importer un frame specifique.
            </p>
            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "rgba(255, 68, 68, 0.08)",
                  border: "1px solid rgba(255, 68, 68, 0.2)",
                  borderRadius: 8,
                  color: "#ff6666",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
            {importMutation.isPending && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "rgba(0, 153, 255, 0.06)",
                  border: "1px solid rgba(0, 153, 255, 0.15)",
                  borderRadius: 8,
                  color: "#0099ff",
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid #ddd",
                    borderTopColor: "#0099ff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Analyse du design en cours...
              </div>
            )}
          </div>
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid #e0e0e0",
                borderRadius: 7,
                color: "#999",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={importMutation.isPending || !figmaUrl}
              style={{
                padding: "8px 20px",
                background: importMutation.isPending ? "#005c99" : "#0099ff",
                border: "none",
                borderRadius: 7,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: importMutation.isPending ? "wait" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
                opacity: !figmaUrl ? 0.4 : 1,
              }}
              onMouseEnter={(e) => { if (!importMutation.isPending) e.currentTarget.style.background = "#007acc" }}
              onMouseLeave={(e) => { if (!importMutation.isPending) e.currentTarget.style.background = "#0099ff" }}
            >
              {importMutation.isPending ? "Import..." : "Importer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Editor Component ────────────────────────────────

const CmsPageEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [editorRef, setEditorRef] = useState<Editor | null>(null)
  const [showFigmaModal, setShowFigmaModal] = useState(false)
  const [activeDevice, setActiveDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop")
  const [activeRightTab, setActiveRightTab] = useState<"style" | "traits" | "layers">("style")

  // ── Mode state ──
  const [editorMode, setEditorMode] = useState<EditorMode>("page")
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  const [editingTemplateName, setEditingTemplateName] = useState("")

  // Inject Framer dark theme
  useEffect(() => {
    injectFramerTheme()
    return () => removeFramerTheme()
  }, [])

  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(""), 4000)
    return () => clearTimeout(t)
  }, [errorMsg])

  // ── Queries ──

  const { data, isLoading, error } = useQuery({
    queryKey: ["cms-page", id],
    queryFn: () =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${id}`),
  })

  const { data: layoutsData, isLoading: layoutsLoading } = useQuery({
    queryKey: ["cms-layouts"],
    queryFn: () =>
      sdk.client.fetch<{ layouts: CmsLayout[] }>("/admin/cms-layouts"),
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
    onError: (err: Error) => setErrorMsg(err.message || "Save failed"),
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
    onError: (err: Error) => setErrorMsg(err.message || "Publish failed"),
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
    onError: (err: Error) => setErrorMsg(err.message || "Unpublish failed"),
  })

  // ── Refs ──

  const saveMutationRef = useRef(saveMutation)
  useEffect(() => { saveMutationRef.current = saveMutation }, [saveMutation])

  const selectedLayoutIdRef = useRef<string | null>(null)
  useEffect(() => { selectedLayoutIdRef.current = selectedLayoutId }, [selectedLayoutId])

  const editorModeRef = useRef<EditorMode>("page")
  useEffect(() => { editorModeRef.current = editorMode }, [editorMode])

  const layoutsRef = useRef<CmsLayout[]>([])
  useEffect(() => {
    if (layoutsData?.layouts) layoutsRef.current = layoutsData.layouts
  }, [layoutsData])

  const pageComponentsStash = useRef<any[]>([])
  const pageStylesStash = useRef<any>(null)


  const initialContentRef = useRef<GjsContent | undefined>(undefined)
  const editorInitializedRef = useRef(false)
  useEffect(() => {
    if (data?.page && !editorInitializedRef.current) {
      initialContentRef.current = data.page.content as GjsContent
      if (data.page.layout_id) setSelectedLayoutId(data.page.layout_id)
    }
  }, [data])

  // ── Serialize ──

  const serializeWithStyles = useCallback((comp: any): any => {
    const json = comp.toJSON()
    delete json["_tpl"]

    const cssStyle = comp.getStyle() || {}
    const el = comp.getEl()
    const domStyle: Record<string, string> = {}
    if (el?.style) {
      const s = el.style
      for (let i = 0; i < s.length; i++) {
        const prop = s[i]
        if (!EDITOR_ONLY_STYLES.has(prop)) {
          domStyle[prop] = s.getPropertyValue(prop)
        }
      }
    }

    const merged = { ...(json.style || {}), ...cssStyle, ...domStyle }
    for (const prop of EDITOR_ONLY_STYLES) delete merged[prop]
    if (Object.keys(merged).length > 0) json.style = merged
    else delete json.style

    const children = comp.components()
    if (children && children.length > 0) {
      json.components = children.map((child: any) => serializeWithStyles(child))
    }
    return json
  }, [])

  // ── Template mode ──

  const enterTemplateMode = useCallback(
    (layoutId: string | null, templateName: string) => {
      if (!editorRef) return
      const editor = editorRef

      // Stash page components (only non-template ones) with their full styles
      pageComponentsStash.current = editor.getWrapper()
        ?.components()
        .models.filter((c: any) => !c.get("_tpl") && c.get("type") !== "content-placeholder")
        .map((c: any) => serializeWithStyles(c)) || []
      pageStylesStash.current = safeGetStyles(editor)

      // Clear
      editor.getWrapper()?.components().reset()
      editor.setStyle([])

      const layout = layoutId
        ? layoutsRef.current.find((l) => l.id === layoutId)
        : null

      if (layout?.component_data?.length) {
        const pos =
          layout.content_position >= 0
            ? Math.min(layout.content_position, layout.component_data.length)
            : layout.component_data.length

        for (let i = 0; i < pos; i++) {
          editor.addComponents(layout.component_data[i])
        }
        addContentPlaceholder(editor)
        for (let i = pos; i < layout.component_data.length; i++) {
          editor.addComponents(layout.component_data[i])
        }
        // Restore template CSS rules
        if (layout.css) editor.Css.addRules(layout.css)
      } else {
        addContentPlaceholder(editor)
      }

      // Re-apply all stashed CSS rules so template components keep their styles
      if (pageStylesStash.current) {
        try { editor.Css.addRules(pageStylesStash.current) } catch { /* skip */ }
      }

      setEditingTemplateName(templateName)
      setEditorMode("template")
    },
    [editorRef, serializeWithStyles]
  )

  const saveTemplateAndExit = useCallback(async () => {
    if (!editorRef) return
    const editor = editorRef
    const wrapper = editor.getWrapper()
    if (!wrapper) return

    const allModels = wrapper.components().models
    const contentPos = getContentPlaceholderIndex(editor)

    // Collect template components (everything except placeholder)
    const templateComps = allModels
      .filter((c: any) => c.get("type") !== "content-placeholder")
      .map((c: any) => serializeWithStyles(c))

    const htmlParts: string[] = []
    const cssParts: string[] = []
    for (const comp of allModels) {
      if (comp.get("type") === "content-placeholder") continue
      try {
        htmlParts.push(editor.getHtml({ component: comp }))
      } catch {
        htmlParts.push(comp.toHTML())
      }
      try {
        const raw = editor.getCss({ component: comp, onlyMatched: true }) || ""
        const cleaned = raw
          .replace(/\*\s*\{\s*box-sizing\s*:\s*border-box\s*;\s*\}/g, "")
          .replace(/body\s*\{[^}]*\}/g, "")
          .replace(/[^{}]*\{\s*\}/g, "")
          .trim()
        if (cleaned) cssParts.push(cleaned)
      } catch { /* skip */ }
    }

    try {
      const result = await sdk.client.fetch<{ layout: CmsLayout }>(
        "/admin/cms-layouts",
        {
          method: "POST",
          body: {
            name: editingTemplateName,
            html: htmlParts.join("\n"),
            css: cssParts.join("\n"),
            component_data: templateComps,
            content_position:
              contentPos >= 0 ? contentPos : templateComps.length,
          },
        }
      )

      const savedLayoutId = result.layout.id

      // Refresh layouts cache and set selected
      await queryClient.invalidateQueries({ queryKey: ["cms-layouts"] })
      const fresh = await sdk.client.fetch<{ layouts: CmsLayout[] }>(
        "/admin/cms-layouts"
      )
      layoutsRef.current = fresh.layouts
      setSelectedLayoutId(savedLayoutId)

      setSuccess("Template saved!")
      setTimeout(() => setSuccess(""), 2000)

      // Rebuild page view
      const layout = fresh.layouts.find((l) => l.id === savedLayoutId)
      editor.getWrapper()?.components().reset()
      editor.setStyle([])
      rebuildPageView(
        editor,
        layout || null,
        pageComponentsStash.current,
        pageStylesStash.current
      )
    } catch (err) {
      setErrorMsg(
        `Template: ${err instanceof Error ? err.message : "save failed"}`
      )
      return // Stay in template mode on error
    }

    setEditorMode("page")
  }, [editorRef, editingTemplateName, serializeWithStyles, queryClient])

  const cancelTemplateMode = useCallback(() => {
    if (!editorRef) return
    const editor = editorRef

    // Discard template changes, rebuild page view
    const layout = selectedLayoutId
      ? layoutsRef.current.find((l) => l.id === selectedLayoutId)
      : null

    editor.getWrapper()?.components().reset()
    editor.setStyle([])
    rebuildPageView(
      editor,
      layout || null,
      pageComponentsStash.current,
      pageStylesStash.current
    )

    setEditorMode("page")
  }, [editorRef, selectedLayoutId])

  // ── Page save ──

  const doSave = useCallback(
    async (editor: Editor) => {
      const wrapper = editor.getWrapper()
      if (!wrapper) return

      const pageComponents = wrapper
        .components()
        .models.filter((c: any) => !c.get("_tpl") && c.get("type") !== "content-placeholder")
        .map((c: any) => serializeWithStyles(c))

      const content: GjsContent = {
        gjsComponents: pageComponents,
        gjsStyles: safeGetStyles(editor),
      }

      saveMutationRef.current.mutate({
        content,
        layout_id: selectedLayoutIdRef.current,
      })
    },
    [serializeWithStyles]
  )

  const doSaveRef = useRef(doSave)
  useEffect(() => { doSaveRef.current = doSave }, [doSave])

  const saveTemplateAndExitRef = useRef(saveTemplateAndExit)
  useEffect(() => {
    saveTemplateAndExitRef.current = saveTemplateAndExit
  }, [saveTemplateAndExit])

  const handleSave = useCallback(() => {
    if (editorRef) doSave(editorRef)
  }, [editorRef, doSave])

  // ── Right panel tab switch ──

  const switchRightTab = useCallback(
    (tab: "style" | "traits" | "layers") => {
      if (!editorRef) return
      setActiveRightTab(tab)
      const viewsPanel = editorRef.Panels.getPanel("views")
      if (!viewsPanel) return
      const btns = viewsPanel.get("buttons")
      if (!btns) return
      // Map tab names to GrapeJS button ids
      const btnMap = { style: "open-sm", traits: "open-tm", layers: "open-layers" }
      const btn = btns.get(btnMap[tab])
      if (btn) btn.set("active", true)
    },
    [editorRef]
  )

  // ── Layout change ──

  const handleLayoutChange = useCallback(
    (newLayoutId: string | null) => {
      if (!editorRef) return
      const editor = editorRef

      const pageComps = extractPageComponents(editor)
      const pageStyles = safeGetStyles(editor)

      setSelectedLayoutId(newLayoutId)

      const layout = newLayoutId
        ? layoutsRef.current.find((l) => l.id === newLayoutId)
        : null

      editor.getWrapper()?.components().reset()
      editor.setStyle([])
      rebuildPageView(editor, layout || null, pageComps, pageStyles)
    },
    [editorRef]
  )

  // ── Figma import ──

  const handleFigmaImport = useCallback(
    (html: string, css: string) => {
      if (!editorRef) return
      editorRef.addComponents(html)
      if (css) editorRef.Css.addRules(css)
      setSuccess("Figma imported!")
      setTimeout(() => setSuccess(""), 3000)
    },
    [editorRef]
  )

  // ── Editor init ──

  const onEditor = useCallback(async (editor: Editor) => {
    if (editorInitializedRef.current) return
    editorInitializedRef.current = true
    setEditorRef(editor)

    registerBlocks(editor)

    // Inject canvas CSS: reset body margin + locked template components
    const injectCanvasCSS = () => {
      const doc = editor.Canvas.getDocument()
      if (doc && !doc.getElementById("canvas-custom-css")) {
        const s = doc.createElement("style")
        s.id = "canvas-custom-css"
        s.textContent = [
          'body { margin: 0 !important; padding: 0 !important; min-height: auto !important; }',
          '[data-tpl-locked="true"] { opacity: 0.5 !important; pointer-events: none !important; }',
        ].join('\n')
        doc.head.appendChild(s)
      }
    }
    editor.on("canvas:frame:load", injectCanvasCSS)
    // Also try immediately in case frame already loaded
    try { injectCanvasCSS() } catch { /* frame not ready */ }

    // Move GrapeJS views-container into our custom right panel
    setTimeout(() => {
      // Activate style manager view by default
      const viewsPanel = editor.Panels.getPanel("views")
      if (viewsPanel) {
        const btns = viewsPanel.get("buttons")
        if (btns) {
          const smBtn = btns.get("open-sm")
          if (smBtn) smBtn.set("active", true)
        }
      }

      // Move the GrapeJS views container (Style Manager, Traits, Layers)
      // into our React-controlled right panel
      const viewsContainer = document.querySelector(".gjs-pn-views-container")
      const target = document.getElementById("right-panel-gjs-views")
      if (viewsContainer && target) {
        target.appendChild(viewsContainer)
        // Make it visible since we hid .gjs-pn-views (the tab bar)
        ;(viewsContainer as HTMLElement).style.display = "block"
        ;(viewsContainer as HTMLElement).style.position = "relative"
        ;(viewsContainer as HTMLElement).style.width = "100%"
        ;(viewsContainer as HTMLElement).style.height = "auto"
        ;(viewsContainer as HTMLElement).style.border = "none"
      }
    }, 300)

    // Load initial content
    const pageContent = initialContentRef.current
    let pageComponents: any[] = []
    let pageStyles: any = []

    if (pageContent?.gjsComponents) {
      pageComponents = pageContent.gjsComponents
      pageStyles = pageContent.gjsStyles || []
    } else if (pageContent?.gjsHtml) {
      // Legacy: convert HTML to components
      editor.setComponents(pageContent.gjsHtml)
      if (pageContent.gjsCss) editor.setStyle(pageContent.gjsCss)
      pageComponents = editor
        .getWrapper()!
        .components()
        .models.map((c: any) => c.toJSON())
      pageStyles = safeGetStyles(editor)
      editor.getWrapper()?.components().reset()
      editor.setStyle([])
    }

    // Find initial layout
    const layoutId = selectedLayoutIdRef.current
    const layout = layoutId
      ? layoutsRef.current.find((l) => l.id === layoutId)
      : null

    rebuildPageView(editor, layout || null, pageComponents, pageStyles)

    // Ctrl+S
    editor.Commands.add("save-page", {
      run: () => {
        if (editorModeRef.current === "template") {
          saveTemplateAndExitRef.current()
        } else {
          doSaveRef.current(editor)
        }
      },
    })
    editor.Keymaps.add("save", "ctrl+s", "save-page")
  }, [])

  // ── Loading / Error states ──

  if (isLoading || layoutsLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              border: "2px solid #ddd",
              borderTopColor: "#0099ff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span
            style={{
              color: "#999",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "-apple-system, system-ui, sans-serif",
            }}
          >
            Loading...
          </span>
        </div>
      </div>
    )
  }

  if (error || !data?.page) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 16,
          background: "#f5f5f5",
        }}
      >
        <span
          style={{
            color: "#ff4444",
            fontSize: 13,
            fontFamily: "-apple-system, system-ui, sans-serif",
          }}
        >
          {error ? (error as Error).message : "Page not found"}
        </span>
        <button
          onClick={() => navigate("/cms-pages")}
          style={{
            padding: "8px 16px",
            background: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            color: "#999",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "-apple-system, system-ui, sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
        >
          Back to Pages
        </button>
      </div>
    )
  }

  const page = data.page
  const layouts = layoutsData?.layouts || []

  const storeFrontUrl =
    typeof window !== "undefined"
      ? (window as any).__MEDUSA_STORE_URL__ || "http://localhost:8000"
      : "http://localhost:8000"

  const toolbarBtn = (
    variant: "ghost" | "secondary" | "primary" | "figma" | "purple"
  ) => ({
    padding: variant === "ghost" ? "6px 10px" : "6px 14px",
    fontSize: 13,
    fontWeight: 500 as const,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    borderRadius: 7,
    border:
      variant === "primary" || variant === "figma" || variant === "purple"
        ? "none"
        : "1px solid #e0e0e0",
    background:
      variant === "primary"
        ? "#0099ff"
        : variant === "purple"
          ? "#7c3aed"
          : variant === "figma"
            ? "linear-gradient(135deg, #F24E1E, #A259FF, #1ABCFE)"
            : variant === "secondary"
              ? "#f7f7f7"
              : "transparent",
    color:
      variant === "primary" ||
      variant === "figma" ||
      variant === "purple"
        ? "#fff"
        : "#666",
    cursor: "pointer" as const,
    transition: "all 0.15s ease",
    lineHeight: "20px",
    textDecoration: "none" as const,
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 6,
  })

  // ── Render ──

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#ffffff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          height: 48,
          borderBottom:
            editorMode === "template"
              ? "1px solid rgba(124, 58, 237, 0.2)"
              : "1px solid #e8e8e8",
          background:
            editorMode === "template"
              ? "rgba(124, 58, 237, 0.04)"
              : "#ffffff",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Left side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {editorMode === "page" ? (
            <>
              <button
                onClick={() => navigate("/cms-pages")}
                style={{
                  ...toolbarBtn("ghost"),
                  border: "none",
                  padding: "6px 8px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#333"; e.currentTarget.style.background = "#f0f0f0" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div style={{ width: 1, height: 20, background: "#e0e0e0", margin: "0 4px" }} />
              <span style={{ color: "#1a1a1a", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {page.title}
              </span>
              <span
                style={{
                  color: "#999",
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                }}
              >
                {page.slug === "/" ? "/" : `/page/${page.slug}`}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background:
                    page.status === "published"
                      ? "rgba(52, 199, 89, 0.12)"
                      : "rgba(255, 159, 10, 0.12)",
                  color:
                    page.status === "published" ? "#34c759" : "#ff9f0a",
                  letterSpacing: "0.01em",
                }}
              >
                {page.status === "published" ? "Live" : "Draft"}
              </span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="3" stroke="#a855f7" strokeWidth="1.5" />
                <rect x="5" y="5" width="6" height="6" rx="1" fill="#a855f7" opacity="0.5" />
              </svg>
              <span
                style={{
                  color: "#a855f7",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                Editing Template: {editingTemplateName}
              </span>
            </>
          )}
        </div>

        {/* Center — Device Switcher */}
        {editorMode === "page" && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#f3f3f3", borderRadius: 8, padding: 2 }}>
            {([
              { name: "Desktop" as const, icon: `<rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` },
              { name: "Tablet" as const, icon: `<rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` },
              { name: "Mobile" as const, icon: `<rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` },
            ]).map((d) => (
              <button
                key={d.name}
                onClick={() => {
                  setActiveDevice(d.name)
                  if (editorRef) editorRef.setDevice(d.name)
                }}
                style={{
                  background: activeDevice === d.name ? "#fff" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 8px",
                  cursor: "pointer",
                  color: activeDevice === d.name ? "#333" : "#aaa",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.15s",
                  boxShadow: activeDevice === d.name ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
                title={d.name}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d.icon }} />
              </button>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {errorMsg && (
            <span
              style={{
                color: "#ff4444",
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
                animation: "fadeIn 0.2s ease",
              }}
            >
              {errorMsg}
            </span>
          )}
          {success && (
            <span
              style={{
                color: "#34c759",
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
                animation: "fadeIn 0.2s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {success}
            </span>
          )}

          {editorMode === "page" ? (
            <>
              {/* Figma Import */}
              <button
                onClick={() => setShowFigmaModal(true)}
                style={toolbarBtn("figma")}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85" }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
              >
                <svg width="12" height="18" viewBox="0 0 38 57" fill="none">
                  <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#fff" />
                  <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#fff" />
                  <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#fff" />
                  <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#fff" />
                  <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#fff" />
                </svg>
                Figma
              </button>
              <div style={{ width: 1, height: 20, background: "#e0e0e0", margin: "0 2px" }} />
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                style={toolbarBtn("secondary")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
              >
                {saveMutation.isPending ? "Saving..." : "Save"}
              </button>
              {page.preview_token && (
                <a
                  href={`${storeFrontUrl}${page.slug === "/" ? "" : `/page/${page.slug}`}/preview?token=${page.preview_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={toolbarBtn("secondary")}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.5 2.5H3C2.72386 2.5 2.5 2.72386 2.5 3V11C2.5 11.2761 2.72386 11.5 3 11.5H11C11.2761 11.5 11.5 11.2761 11.5 11V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M8 2.5H11.5V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.5 2.5L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Preview
                </a>
              )}
              {page.status === "draft" ? (
                <button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  style={toolbarBtn("primary")}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#007acc" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#0099ff" }}
                >
                  {publishMutation.isPending ? "Publishing..." : "Publish"}
                </button>
              ) : (
                <button
                  onClick={() => unpublishMutation.mutate()}
                  disabled={unpublishMutation.isPending}
                  style={toolbarBtn("secondary")}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
                >
                  {unpublishMutation.isPending ? "..." : "Unpublish"}
                </button>
              )}
            </>
          ) : (
            <>
              {/* Template mode buttons */}
              <button
                onClick={cancelTemplateMode}
                style={toolbarBtn("secondary")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
              >
                Cancel
              </button>
              <button
                onClick={saveTemplateAndExit}
                style={toolbarBtn("purple")}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#6d28d9" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#7c3aed" }}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Editor + Sidebar ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex" }}>
        {/* Framer-style left sidebar */}
        <FramerSidebar editor={editorRef} />

        {/* GrapeJS Editor */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <GjsEditor
          grapesjs={grapesjs}
          grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
          plugins={[gjsPresetWebpage]}
          options={{
            height: "100%",
            storageManager: false,
            blockManager: { custom: true },
            canvas: {
              styles: [
                "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
              ],
            },
            deviceManager: {
              devices: [
                { name: "Desktop", width: "" },
                { name: "Tablet", width: "768px", widthMedia: "992px" },
                { name: "Mobile", width: "375px", widthMedia: "480px" },
              ],
            },
          }}
          onEditor={onEditor}
        />
        </div>{/* /editor wrapper */}

        {/* ── Right Panel (Template + Tabs) ── */}
        <div
          style={{
            width: 280,
            background: "#fff",
            borderLeft: "1px solid #e8e8e8",
            overflowY: "auto",
            flexShrink: 0,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          }}
        >
            {/* ── Tab Switcher (Style / Settings / Layers) ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                padding: "8px 10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {([
                { id: "style" as const, label: "Style", icon: `<path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` },
                { id: "traits" as const, label: "Settings", icon: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5" fill="none"/>` },
                { id: "layers" as const, label: "Layers", icon: `<polygon points="12,2 2,7 12,12 22,7" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><polyline points="2,17 12,22 22,17" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="2,12 12,17 22,12" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchRightTab(tab.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "6px 4px",
                    border: "none",
                    borderRadius: 6,
                    background: activeRightTab === tab.id ? "#f0f0f0" : "transparent",
                    color: activeRightTab === tab.id ? "#333" : "#aaa",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  title={tab.label}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: tab.icon }} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── Template Section ── */}
            <div style={{ padding: "14px 12px", borderBottom: "1px solid #f0f0f0" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#777",
                letterSpacing: "0.04em",
                marginBottom: 10,
                textTransform: "uppercase" as const,
              }}
            >
              Template
            </div>

            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "#666",
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Layout
            </label>
            <select
              value={selectedLayoutId || ""}
              onChange={(e) => handleLayoutChange(e.target.value || null)}
              style={{
                width: "100%",
                padding: "6px 8px",
                background: "#f5f5f5",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                color: "#333",
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              <option value="">None</option>
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {selectedLayoutId && (
              <button
                onClick={() => {
                  const layout = layouts.find(
                    (l) => l.id === selectedLayoutId
                  )
                  if (layout) enterTemplateMode(layout.id, layout.name)
                }}
                style={{
                  width: "100%",
                  padding: "6px 0",
                  background: "transparent",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  color: "#999",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  marginBottom: 5,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7c3aed"
                  e.currentTarget.style.color = "#a855f7"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e0e0e0"
                  e.currentTarget.style.color = "#999"
                }}
              >
                Edit
              </button>
            )}

            <button
              onClick={() => {
                const name = prompt("Template name:")
                if (!name?.trim()) return
                enterTemplateMode(null, name.trim())
              }}
              style={{
                width: "100%",
                padding: "6px 0",
                background: "transparent",
                border: "1px dashed #e0e0e0",
                borderRadius: 4,
                color: "#666",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ccc"
                e.currentTarget.style.color = "#999"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e0e0e0"
                e.currentTarget.style.color = "#666"
              }}
            >
              + New Template
            </button>
            </div>

          {/* GrapeJS Style Manager / Traits / Layers rendered below */}
          <div id="right-panel-gjs-views" />
        </div>{/* /right panel */}
      </div>{/* /editor+sidebar row */}

      {showFigmaModal && (
        <FigmaImportModal
          onClose={() => setShowFigmaModal(false)}
          onImport={handleFigmaImport}
        />
      )}
    </div>
  )
}

export default CmsPageEditor
