import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useEffect, useRef } from "react"
import grapesjs, { Editor } from "grapesjs"
import GjsEditor from "@grapesjs/react"
import gjsPresetWebpage from "grapesjs-preset-webpage"
import { registerBlocks } from "../../../lib/grapes/blocks"
import { injectFramerTheme, removeFramerTheme } from "../../../lib/grapes/framer-theme"
import { sdk } from "../../../lib/client"

type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_og_image_url: string | null
  content: Record<string, any>
  preview_token: string | null
  updated_at: string
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: any
  gjsStyles?: any
}

// ── Figma Import Modal ─────────────────────────────────

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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "relative",
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
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
              borderBottom: "1px solid #1e1e1e",
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
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
                Import Figma
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555" }}
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
                color: "#888",
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
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                color: "#ddd",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#0099ff" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2a2a" }}
            />
            <p style={{ color: "#555", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
              Collez l'URL d'un frame Figma. Utilisez <strong style={{ color: "#777" }}>node-id</strong> dans l'URL pour importer un frame specifique.
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
                    border: "2px solid #333",
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
              borderTop: "1px solid #1e1e1e",
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
                border: "1px solid #2a2a2a",
                borderRadius: 7,
                color: "#999",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#999" }}
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

// ── Main Editor Component ──────────────────────────────

const CmsPageEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [editorRef, setEditorRef] = useState<Editor | null>(null)
  const [showFigmaModal, setShowFigmaModal] = useState(false)

  // Inject Framer dark theme for GrapeJS
  useEffect(() => {
    injectFramerTheme()
    return () => removeFramerTheme()
  }, [])

  // Clear error after 4s
  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(""), 4000)
    return () => clearTimeout(t)
  }, [errorMsg])

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

  // Refs to avoid stale closures in GrapeJS commands
  const saveMutationRef = useRef(saveMutation)
  useEffect(() => { saveMutationRef.current = saveMutation }, [saveMutation])

  // Editor-only properties that should never be persisted in layout/page data
  const EDITOR_ONLY_PROPS = new Set(["template-name", "is-template", "layout-role"])
  // Editor-only outline styles (visual template indicator)
  const EDITOR_ONLY_STYLES = new Set([
    "outline", "outline-color", "outline-style", "outline-width", "outline-offset",
  ])

  // Recursively bake all styles into component JSON so they persist across loads.
  const serializeWithStyles = useCallback((comp: any): any => {
    const json = comp.toJSON()

    // Strip editor-only properties
    for (const prop of EDITOR_ONLY_PROPS) {
      delete json[prop]
    }

    // 1. Get styles from CssComposer rule
    const cssStyle = comp.getStyle() || {}

    // 2. Get inline styles from the rendered DOM element (resize handles set these)
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

    // Merge: JSON defaults < CssComposer < DOM inline (most specific wins)
    const merged = { ...(json.style || {}), ...cssStyle, ...domStyle }
    for (const prop of EDITOR_ONLY_STYLES) {
      delete merged[prop]
    }
    if (Object.keys(merged).length > 0) {
      json.style = merged
    } else {
      delete json.style
    }

    const children = comp.components()
    if (children && children.length > 0) {
      json.components = children.map((child: any) => serializeWithStyles(child))
    }
    return json
  }, [])

  // Clean outline from a component before export, restore after
  const withCleanOutline = useCallback((comp: any, fn: () => void) => {
    const el = comp.getEl()
    if (el?.style) {
      el.style.outline = ""
      el.style.outlineOffset = ""
    }
    const origStyle = { ...comp.getStyle() }
    const clean = { ...origStyle }
    delete clean["outline"]; delete clean["outline-color"]
    delete clean["outline-style"]; delete clean["outline-width"]; delete clean["outline-offset"]
    comp.setStyle(clean)

    fn()

    comp.setStyle(origStyle)
    if (el?.style) {
      el.style.outline = "2px dashed #0099ff"
      el.style.outlineOffset = "-2px"
    }
  }, [])

  // Save template blocks grouped by name to the layouts API
  const saveLayouts = useCallback(async (editor: Editor) => {
    const allModels = editor.getComponents().models
    // Group root-level components by their template-name
    const groups = new Map<string, any[]>()
    for (const comp of allModels) {
      const name = comp.get("template-name")
      if (!name) continue
      if (!groups.has(name)) groups.set(name, [])
      groups.get(name)!.push(comp)
    }

    for (const [name, comps] of groups) {
      const htmlParts: string[] = []
      const cssParts: string[] = []
      const componentDataArr: any[] = []

      for (const comp of comps) {
        withCleanOutline(comp, () => {
          // Collect HTML
          try {
            htmlParts.push(editor.getHtml({ component: comp }))
          } catch {
            htmlParts.push(comp.toHTML())
          }
          // Collect CSS
          try {
            const rawCss = editor.getCss({ component: comp, onlyMatched: true }) || ""
            const cleaned = rawCss
              .replace(/\*\s*\{\s*box-sizing\s*:\s*border-box\s*;\s*\}/g, "")
              .replace(/body\s*\{[^}]*\}/g, "")
              .replace(/[^{}]*\{\s*\}/g, "")
              .trim()
            if (cleaned) cssParts.push(cleaned)
          } catch { /* skip */ }
          // Serialize component data
          componentDataArr.push(serializeWithStyles(comp))
        })
      }

      await sdk.client.fetch("/admin/cms-layouts", {
        method: "POST",
        body: {
          name,
          html: htmlParts.join("\n"),
          css: cssParts.join("\n"),
          component_data: componentDataArr,
        },
      })
    }
  }, [serializeWithStyles, withCleanOutline])

  const saveLayoutsRef = useRef(saveLayouts)
  useEffect(() => { saveLayoutsRef.current = saveLayouts }, [saveLayouts])

  // Single save function used by both the button and Ctrl+S
  const doSave = useCallback(async (editor: Editor) => {
    // 1. Save layouts to API — abort if this fails to avoid losing template blocks
    try {
      await saveLayoutsRef.current(editor)
    } catch (err) {
      console.error("Layout save failed:", err)
      setErrorMsg(`Template: ${err instanceof Error ? err.message : "save failed"}`)
      return
    }

    // 2. Build page content EXCLUDING template blocks
    const allComponents = editor.getComponents()
    const pageOnlyComponents = allComponents.models
      .filter((comp: any) => !comp.get("template-name"))
      .map((comp: any) => comp.toJSON())

    const content: GjsContent = {
      gjsComponents: pageOnlyComponents,
      gjsStyles: editor.getStyle(),
    }
    saveMutationRef.current.mutate({ content })
  }, [])

  const handleSave = useCallback(() => {
    if (editorRef) doSave(editorRef)
  }, [editorRef, doSave])

  const handleFigmaImport = useCallback(
    (html: string, css: string) => {
      if (!editorRef) return
      editorRef.addComponents(html)
      if (css) {
        editorRef.Css.addRules(css)
      }
      setSuccess("Figma imported!")
      setTimeout(() => setSuccess(""), 3000)
    },
    [editorRef]
  )

  // Store initial page content in a ref so onEditor doesn't re-run on data changes
  const initialContentRef = useRef<GjsContent | undefined>(undefined)
  const editorInitializedRef = useRef(false)
  useEffect(() => {
    if (data?.page?.content && !editorInitializedRef.current) {
      initialContentRef.current = data.page.content as GjsContent
    }
  }, [data])

  const doSaveRef = useRef(doSave)
  useEffect(() => { doSaveRef.current = doSave }, [doSave])

  const onEditor = useCallback(async (editor: Editor) => {
    if (editorInitializedRef.current) return
    editorInitializedRef.current = true
    setEditorRef(editor)

    registerBlocks(editor)

    // Load existing content
    const pageContent = initialContentRef.current
    if (pageContent?.gjsComponents) {
      editor.setComponents(pageContent.gjsComponents)
      if (pageContent.gjsStyles) {
        editor.setStyle(pageContent.gjsStyles)
      }
    } else if (pageContent?.gjsHtml) {
      editor.setComponents(pageContent.gjsHtml)
      if (pageContent.gjsCss) {
        editor.setStyle(pageContent.gjsCss)
      }
    }

    // Always inject templates from API (page content never includes them)
    try {
      const res = await sdk.client.fetch<{
        layouts: Array<{ name: string; component_data: any[]; css: string }>
      }>("/admin/cms-layouts")

      for (const layout of res.layouts) {
        if (!layout.component_data?.length) continue

        // Each layout has an array of stacked sections
        for (const compData of layout.component_data) {
          const added = editor.addComponents(compData)
          if (added?.length > 0) {
            added[0].set("template-name", layout.name)
          }
        }
        if (layout.css) {
          editor.Css.addRules(layout.css)
        }
      }
    } catch {
      // Continue without templates
    }

    // Ctrl+S — delegates through ref to always use latest doSave
    editor.Commands.add('save-page', {
      run: () => doSaveRef.current(editor),
    })
    editor.Keymaps.add('save', 'ctrl+s', 'save-page')
  }, [])

  if (isLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0a0a0a",
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 24, height: 24, border: "2px solid #333",
            borderTopColor: "#0099ff", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ color: "#555", fontSize: 13, fontWeight: 500, fontFamily: "-apple-system, system-ui, sans-serif" }}>
            Loading...
          </span>
        </div>
      </div>
    )
  }

  if (error || !data?.page) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh", gap: 16, background: "#0a0a0a",
      }}>
        <span style={{ color: "#ff4444", fontSize: 13, fontFamily: "-apple-system, system-ui, sans-serif" }}>
          {error ? (error as Error).message : "Page not found"}
        </span>
        <button
          onClick={() => navigate("/cms-pages")}
          style={{
            padding: "8px 16px", background: "#141414", border: "1px solid #2a2a2a",
            borderRadius: 8, color: "#999", fontSize: 13, cursor: "pointer",
            fontFamily: "-apple-system, system-ui, sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#fff" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#999" }}
        >
          Back to Pages
        </button>
      </div>
    )
  }

  const page = data.page

  const storeFrontUrl = typeof window !== "undefined"
    ? (window as any).__MEDUSA_STORE_URL__ || "http://localhost:8000"
    : "http://localhost:8000"

  const toolbarBtn = (variant: "ghost" | "secondary" | "primary" | "figma") => ({
    padding: variant === "ghost" ? "6px 10px" : "6px 14px",
    fontSize: 13,
    fontWeight: 500 as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    borderRadius: 7,
    border: variant === "primary" || variant === "figma" ? "none" : "1px solid #2a2a2a",
    background:
      variant === "primary" ? "#0099ff"
        : variant === "figma" ? "linear-gradient(135deg, #F24E1E, #A259FF, #1ABCFE)"
          : variant === "secondary" ? "#141414"
            : "transparent",
    color: variant === "primary" || variant === "figma" ? "#fff" : "#999",
    cursor: "pointer" as const,
    transition: "all 0.15s ease",
    lineHeight: "20px",
    textDecoration: "none" as const,
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 6,
  })

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#0a0a0a",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          height: 48,
          borderBottom: "1px solid #1a1a1a",
          background: "#0a0a0a",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate("/cms-pages")}
            style={{ ...toolbarBtn("ghost"), border: "none", padding: "6px 8px" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#1a1a1a" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#999"; e.currentTarget.style.background = "transparent" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div style={{ width: 1, height: 20, background: "#1a1a1a", margin: "0 4px" }} />

          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {page.title}
          </span>

          <span style={{
            color: "#444", fontSize: 12, fontWeight: 400,
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          }}>
            {page.slug === "/" ? "/" : `/page/${page.slug}`}
          </span>

          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 10,
              background: page.status === "published" ? "rgba(52, 199, 89, 0.12)" : "rgba(255, 159, 10, 0.12)",
              color: page.status === "published" ? "#34c759" : "#ff9f0a",
              letterSpacing: "0.01em",
            }}
          >
            {page.status === "published" ? "Live" : "Draft"}
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {errorMsg && (
            <span style={{
              color: "#ff4444", fontSize: 12, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 4,
              animation: "fadeIn 0.2s ease",
            }}>
              {errorMsg}
            </span>
          )}

          {success && (
            <span style={{
              color: "#34c759", fontSize: 12, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 4,
              animation: "fadeIn 0.2s ease",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {success}
            </span>
          )}

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

          <div style={{ width: 1, height: 20, background: "#1a1a1a", margin: "0 2px" }} />

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            style={toolbarBtn("secondary")}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#999" }}
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>

          {page.preview_token && (
            <a
              href={`${storeFrontUrl}${page.slug === "/" ? "" : `/page/${page.slug}`}/preview?token=${page.preview_token}`}
              target="_blank"
              rel="noopener noreferrer"
              style={toolbarBtn("secondary")}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#999" }}
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
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#999" }}
            >
              {unpublishMutation.isPending ? "..." : "Unpublish"}
            </button>
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
