import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useEffect, useRef } from "react"
import type { Editor } from "grapesjs"
import { sdk } from "../../../lib/client"
import { removeFramerTheme } from "../../../lib/grapes/theme"
import {
  addContentPlaceholder,
  getContentPlaceholderIndex,
  getContentZone,
  getPageContentModels,
} from "../../../lib/grapes/plugins/content-slot"
import { computePromotePosition } from "../../../lib/grapes/plugins/template-sync"
import { EDITOR_ONLY_STYLES, safeGetStyles } from "../../../lib/grapes/types"
import type { CmsPage, CmsLayout, GjsContent, EditorMode } from "../../../lib/grapes/types"
import { lockComponent } from "../../../lib/grapes/plugins/block-lock"

// Extracted components
import { FigmaImportModal } from "../../../lib/grapes/editor/FigmaImportModal"
import { EditorToolbar } from "../../../lib/grapes/editor/EditorToolbar"
import { EditorSidebar } from "../../../lib/grapes/editor/EditorSidebar"
import { EditorRightPanel } from "../../../lib/grapes/editor/EditorRightPanel"
import { GrapesEditor } from "../../../lib/grapes/editor/GrapesEditor"

// ── Helpers ──────────────────────────────────────────────

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

    // Wrapper is NOT droppable — only content-zone is
    wrapper.set("droppable", false)

    // Template before content
    for (let i = 0; i < pos; i++) {
      const added = editor.addComponents(layout.component_data[i])
      if (added?.length) lockComponent(added[0])
    }

    // Content zone — only droppable area for page blocks
    const zone = wrapper.components().add(
      { type: "content-zone" },
      { at: pos }
    )
    for (const comp of pageComponents) {
      zone.components().add(comp)
    }

    // Template after content
    for (let i = pos; i < layout.component_data.length; i++) {
      const added = editor.addComponents(layout.component_data[i])
      if (added?.length) lockComponent(added[0])
    }
  } else {
    // No template — wrapper is droppable normally
    wrapper.set("droppable", true)
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
  return getPageContentModels(editor).map((c: any) => c.toJSON())
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
    let json: any
    try {
      json = comp.toJSON()
    } catch {
      // Fallback for components with broken internal references
      json = {
        tagName: comp.get?.("tagName") || "div",
        type: comp.get?.("type") || "",
        attributes: comp.getAttributes?.() || {},
        content: comp.get?.("content") || "",
      }
    }
    delete json["_tpl"]

    const cssStyle = comp.getStyle?.() || {}
    const el = comp.getEl?.()
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

    const children = comp.components?.()
    if (children && children.length > 0) {
      json.components = []
      children.forEach((child: any) => {
        if (!child) return
        try {
          json.components.push(serializeWithStyles(child))
        } catch { /* skip broken child */ }
      })
      if (json.components.length === 0) delete json.components
    }
    return json
  }, [])

  // ── Template mode ──

  const enterTemplateMode = useCallback(
    (layoutId: string | null, templateName: string) => {
      if (!editorRef) return
      const editor = editorRef

      // Stash page components (from content-zone or wrapper) with their full styles
      pageComponentsStash.current = getPageContentModels(editor)
        .map((c: any) => serializeWithStyles(c))
      pageStylesStash.current = safeGetStyles(editor)

      // Clear and re-enable droppable for template editing
      const wrapper = editor.getWrapper()
      wrapper?.components().reset()
      wrapper?.set("droppable", true)
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
      // Include the content-placeholder marker in the HTML output
      if (comp.get("type") === "content-placeholder") {
        htmlParts.push("<!-- CMS_CONTENT_PLACEHOLDER -->")
        continue
      }
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
      const layoutBody = {
        name: editingTemplateName,
        html: htmlParts.join("\n"),
        css: cssParts.join("\n"),
        component_data: templateComps,
        content_position:
          contentPos >= 0 ? contentPos : templateComps.length,
      }

      // Update existing layout or create a new one
      const existingLayoutId = selectedLayoutIdRef.current
      const result = existingLayoutId
        ? await sdk.client.fetch<{ layout: CmsLayout }>(
            `/admin/cms-layouts/${existingLayoutId}`,
            { method: "POST", body: layoutBody }
          )
        : await sdk.client.fetch<{ layout: CmsLayout }>(
            "/admin/cms-layouts",
            { method: "POST", body: layoutBody }
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
      const pageContentModels = getPageContentModels(editor)
      const pageComponents = pageContentModels
        .map((c: any) => serializeWithStyles(c))

      // Generate HTML/CSS for storefront rendering
      const htmlParts: string[] = []
      const cssParts: string[] = []
      for (const comp of pageContentModels) {
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

      const content: GjsContent = {
        gjsHtml: htmlParts.join("\n"),
        gjsCss: cssParts.join("\n"),
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
      // Add inside content-zone if it exists, otherwise to wrapper
      const zone = getContentZone(editorRef)
      if (zone) {
        zone.components().add(html)
      } else {
        editorRef.addComponents(html)
      }
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
    const canvasCSSContent = [
      'body { margin: 0 !important; padding: 0 !important; min-height: auto !important; }',
      '[data-tpl-locked="true"] { position: relative !important; box-shadow: inset 0 0 0 2px rgba(168, 85, 247, 0.35) !important; cursor: pointer !important; }',
      '[data-tpl-locked="true"] * { pointer-events: none !important; }',
      '[data-tpl-locked="true"]::before { content: "" !important; position: absolute !important; inset: 0 !important; background: rgba(168, 85, 247, 0.04) !important; pointer-events: none !important; z-index: 1 !important; }',
      '[data-tpl-locked="true"]::after { content: "\\1F512  Template" !important; position: absolute !important; top: 8px !important; right: 10px !important; font-size: 11px !important; font-weight: 600 !important; color: rgba(168, 85, 247, 0.85) !important; background: rgba(255, 255, 255, 0.92) !important; border: 1px solid rgba(168, 85, 247, 0.25) !important; padding: 3px 10px !important; border-radius: 6px !important; letter-spacing: 0.02em !important; pointer-events: none !important; z-index: 10 !important; font-family: -apple-system, system-ui, sans-serif !important; backdrop-filter: blur(4px) !important; }',
    ].join('\n')

    const injectCanvasCSS = () => {
      // Try both methods to get the iframe document
      const doc = editor.Canvas.getDocument()
        || editor.Canvas.getFrameEl()?.contentDocument
      if (!doc) return false
      if (doc.getElementById("canvas-custom-css")) return true
      const s = doc.createElement("style")
      s.id = "canvas-custom-css"
      s.textContent = canvasCSSContent
      doc.head.appendChild(s)
      return true
    }
    editor.on("canvas:frame:load", () => injectCanvasCSS())
    editor.on("canvas:frame:load:body", () => injectCanvasCSS())
    editor.on("load", () => {
      if (!injectCanvasCSS()) {
        setTimeout(() => injectCanvasCSS(), 300)
      }
    })
    injectCanvasCSS()

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

    // Promote request from context menu (page mode → move block into template)
    editor.on("template:promote-request", ({ component }: { component: any }) => {
      const layoutId = selectedLayoutIdRef.current
      if (!layoutId) {
        setErrorMsg("Sélectionnez d'abord un template")
        return
      }
      const confirmed = window.confirm(
        "Ce bloc sera partagé sur toutes les pages utilisant ce template"
      )
      if (!confirmed) return

      const layout = layoutsRef.current.find((l) => l.id === layoutId)
      if (!layout) return

      // Capture CSS rules that target this component BEFORE removing
      let compCss = ""
      try {
        const raw = editor.getCss({ component, onlyMatched: true }) || ""
        compCss = raw
          .replace(/\*\s*\{\s*box-sizing\s*:\s*border-box\s*;\s*\}/g, "")
          .replace(/body\s*\{[^}]*\}/g, "")
          .replace(/[^{}]*\{\s*\}/g, "")
          .trim()
      } catch { /* skip */ }

      // Serialize the component (with inline styles) before removing
      const serialized = serializeWithStyles(component)

      const contentPos = layout.content_position >= 0
        ? layout.content_position
        : (layout.component_data?.length || 0)

      // Component lives inside content-zone; find its page-relative index
      const zone = getContentZone(editor)
      const pageModels = zone
        ? zone.components().models
        : (editor.getWrapper()?.components().models || [])
      const pageIndex = pageModels.indexOf(component)
      const pageComponentCount = zone
        ? pageModels.length
        : pageModels.filter((c: any) => !c.get("_tpl") && c.get("type") !== "content-zone").length

      // Map page-relative index to wrapper-level index for computePromotePosition
      const wrapperIndex = contentPos + Math.max(0, pageIndex)

      const { insertIndex, newContentPosition } = computePromotePosition(
        wrapperIndex, contentPos, pageComponentCount
      )

      const newTemplateData = [...(layout.component_data || [])]
      newTemplateData.splice(insertIndex, 0, serialized)

      // Remove from canvas
      component.remove()

      // Merge CSS rules into the layout's existing CSS
      const updatedCss = compCss
        ? (layout.css ? layout.css + "\n" + compCss : compCss)
        : layout.css || ""

      // Save layout update
      sdk.client
        .fetch<{ layout: CmsLayout }>(`/admin/cms-layouts/${layoutId}`, {
          method: "POST",
          body: {
            component_data: newTemplateData,
            content_position: newContentPosition,
            css: updatedCss,
          },
        })
        .then(async () => {
          // Refresh layouts cache
          const fresh = await sdk.client.fetch<{ layouts: CmsLayout[] }>(
            "/admin/cms-layouts"
          )
          layoutsRef.current = fresh.layouts
          queryClient.setQueryData(["cms-layouts"], fresh)

          // Rebuild page view with updated template
          const pageComponents = extractPageComponents(editor)
          const pageStyles = safeGetStyles(editor)
          const updatedLayout = fresh.layouts.find((l) => l.id === layoutId)

          editor.getWrapper()?.components().reset()
          editor.setStyle([])
          rebuildPageView(editor, updatedLayout || null, pageComponents, pageStyles)

          setSuccess("Bloc ajouté au template!")
          setTimeout(() => setSuccess(""), 2000)
        })
        .catch((err: unknown) => {
          setErrorMsg(
            `Promote: ${err instanceof Error ? err.message : "failed"}`
          )
        })
    })

    // Demote request from context menu (template mode → remove block from template)
    editor.on("template:demote-request", ({ component }: { component: any }) => {
      const confirmed = window.confirm(
        "Ce bloc sera retiré du template"
      )
      if (!confirmed) return

      // Serialize before removing (to add to page content stash)
      const serialized = serializeWithStyles(component)

      // Find its index in wrapper and content placeholder position
      const wrapper = editor.getWrapper()
      const models = wrapper?.components().models || []
      const wrapperIndex = models.indexOf(component)
      const placeholderIndex = models.findIndex(
        (c: any) => c.get("type") === "content-placeholder"
      )

      // Remove from canvas
      component.remove()

      // Add to page stash so it reappears as page content when exiting template mode
      if (placeholderIndex >= 0 && wrapperIndex < placeholderIndex) {
        pageComponentsStash.current.unshift(serialized)
      } else {
        pageComponentsStash.current.push(serialized)
      }

      setSuccess("Bloc retiré du template")
      setTimeout(() => setSuccess(""), 2000)
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
          onDeleteLayout={async (layoutId) => {
            try {
              await sdk.client.fetch(`/admin/cms-layouts/${layoutId}`, {
                method: "DELETE",
              })
              await queryClient.invalidateQueries({ queryKey: ["cms-layouts"] })
              if (selectedLayoutId === layoutId) {
                setSelectedLayoutId(null)
                handleLayoutChange(null)
              }
              setSuccess("Template supprimé")
              setTimeout(() => setSuccess(""), 2000)
            } catch (err: any) {
              setErrorMsg(err.message || "Erreur lors de la suppression")
              setTimeout(() => setErrorMsg(""), 3000)
            }
          }}
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
