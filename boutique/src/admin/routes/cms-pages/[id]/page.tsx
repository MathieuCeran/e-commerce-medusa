import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useEffect, useRef } from "react"
import type { Editor } from "grapesjs"
import { sdk } from "../../../lib/client"
import { removeFramerTheme } from "../../../lib/grapes/theme"
import {
  addContentPlaceholder,
  getContentPlaceholderIndex,
} from "../../../lib/grapes/plugins/content-slot"
import { safeGetStyles } from "../../../lib/grapes/types"
import type { CmsPage, CmsLayout, GjsContent, EditorMode } from "../../../lib/grapes/types"

// Extracted components
import { FigmaImportModal } from "../../../lib/grapes/editor/FigmaImportModal"
import { EditorToolbar } from "../../../lib/grapes/editor/EditorToolbar"
import { EditorSidebar } from "../../../lib/grapes/editor/EditorSidebar"
import { EditorRightPanel } from "../../../lib/grapes/editor/EditorRightPanel"
import { GrapesEditor } from "../../../lib/grapes/editor/GrapesEditor"

// ── Helpers ──────────────────────────────────────────────

const EDITOR_ONLY_STYLES = new Set([
  "outline", "outline-color", "outline-style", "outline-width", "outline-offset",
])

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
    // Ensure stable UUID for cross-mode identification
    if (!comp.getAttributes()["data-tpl-block-id"]) {
      comp.addAttributes({ "data-tpl-block-id": crypto.randomUUID() })
    }
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

  // Cleanup theme on unmount
  useEffect(() => {
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
  useEffect(() => {
    editorModeRef.current = editorMode
    // Keep context-menu plugin in sync with current mode
    if (editorRef) {
      ;(editorRef as any).__editorMode = editorMode
    }
  }, [editorMode, editorRef])

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

    // Set editor mode for context menu plugin
    ;(editor as any).__editorMode = editorModeRef.current

    // Double-click on template block → switch to template mode
    editor.on("template:edit-request", ({ componentId }: { componentId: string }) => {
      const layoutId = selectedLayoutIdRef.current
      const currentLayout = layoutId
        ? layoutsRef.current.find((l) => l.id === layoutId)
        : null
      if (currentLayout) {
        enterTemplateMode(currentLayout.id, currentLayout.name)
      }
    })

    // Promote request from context menu
    editor.on("template:promote-request", ({ component }: { component: any }) => {
      const confirmed = window.confirm(
        "Ce bloc sera partagé sur toutes les pages utilisant ce template"
      )
      if (!confirmed) return
      // TODO: implement full promote flow with computePromotePosition
    })

    // Demote request from context menu
    editor.on("template:demote-request", ({ component }: { component: any }) => {
      // TODO: implement full demote flow with computeDemotePosition
    })

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
      <EditorToolbar
        editor={editorRef}
        page={page}
        editorMode={editorMode}
        activeDevice={activeDevice}
        isSaving={saveMutation.isPending}
        onSave={handleSave}
        onPublish={() => publishMutation.mutate()}
        onUnpublish={() => unpublishMutation.mutate()}
        onDeviceChange={(d) => setActiveDevice(d as "Desktop" | "Tablet" | "Mobile")}
        onFigmaImport={handleFigmaImport}
        onNavigateBack={() => navigate("/cms-pages")}
        onShowFigma={() => setShowFigmaModal(true)}
        success={success}
        errorMsg={errorMsg}
        isPublishing={publishMutation.isPending}
        isUnpublishing={unpublishMutation.isPending}
        onCancelTemplate={cancelTemplateMode}
        onDoneTemplate={saveTemplateAndExit}
        editorModeName={editingTemplateName}
        storeFrontUrl={storeFrontUrl}
      />

      {/* ── Editor + Sidebar ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex" }}>
        {/* Framer-style left sidebar */}
        <EditorSidebar editor={editorRef} />

        {/* GrapeJS Editor */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <GrapesEditor onEditor={onEditor} />
        </div>

        {/* ── Right Panel (Template + Tabs) ── */}
        <EditorRightPanel
          editor={editorRef}
          editorMode={editorMode}
          layouts={layouts}
          activeLayoutId={selectedLayoutId}
          onLayoutChange={handleLayoutChange}
          onToggleMode={() => {
            const layout = layouts.find((l) => l.id === selectedLayoutId)
            if (layout) enterTemplateMode(layout.id, layout.name)
          }}
          onCreateTemplate={(name) => enterTemplateMode(null, name)}
          activeRightTab={activeRightTab}
          onTabChange={switchRightTab}
        />
      </div>

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
