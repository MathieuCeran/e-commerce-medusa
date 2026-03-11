import { useState, useEffect, useCallback } from "react"
import type { EditorToolbarProps } from "../types"

// Internal helper — generates consistent button styles based on variant
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

// Small icon-only button for editor actions
const iconBtn = (active = false, disabled = false) => ({
  background: active ? "#f0f0f0" : "transparent",
  border: "none",
  borderRadius: 6,
  padding: "5px 7px",
  cursor: disabled ? "default" as const : "pointer" as const,
  color: disabled ? "#d0d0d0" : active ? "#333" : "#999",
  display: "flex" as const,
  alignItems: "center" as const,
  transition: "all 0.15s",
  opacity: disabled ? 0.5 : 1,
})

export type EditorToolbarFullProps = EditorToolbarProps & {
  editorModeName: string
  success: string
  errorMsg: string
  isPublishing: boolean
  isUnpublishing: boolean
  onShowFigma: () => void
  onCancelTemplate: () => void
  onDoneTemplate: () => void
  storeFrontUrl: string
}

export function EditorToolbar({
  editor,
  page,
  editorMode,
  activeDevice,
  isSaving,
  onSave,
  onPublish,
  onUnpublish,
  onDeviceChange,
  onNavigateBack,
  onShowFigma,
  success,
  errorMsg,
  isPublishing,
  isUnpublishing,
  onCancelTemplate,
  onDoneTemplate,
  editorModeName,
  storeFrontUrl,
}: EditorToolbarFullProps) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [outlinesOn, setOutlinesOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [codeHtml, setCodeHtml] = useState("")
  const [codeCss, setCodeCss] = useState("")

  // Track undo/redo state
  useEffect(() => {
    if (!editor) return
    const update = () => {
      setCanUndo(editor.UndoManager.hasUndo())
      setCanRedo(editor.UndoManager.hasRedo())
    }
    update()
    editor.on("change:changesCount", update)
    return () => { editor.off("change:changesCount", update) }
  }, [editor])

  const handleUndo = useCallback(() => {
    if (editor?.UndoManager.hasUndo()) editor.UndoManager.undo()
  }, [editor])

  const handleRedo = useCallback(() => {
    if (editor?.UndoManager.hasRedo()) editor.UndoManager.redo()
  }, [editor])

  const toggleOutlines = useCallback(() => {
    if (!editor) return
    const cmd = "sw-visibility"
    if (outlinesOn) {
      editor.stopCommand(cmd)
    } else {
      editor.runCommand(cmd)
    }
    setOutlinesOn(!outlinesOn)
  }, [editor, outlinesOn])

  const openPreview = useCallback(() => {
    const previewUrl = page.preview_token
      ? `${storeFrontUrl}${page.slug === "/" ? "" : `/page/${page.slug}`}/preview?token=${page.preview_token}`
      : `${storeFrontUrl}${page.slug === "/" ? "" : `/page/${page.slug}`}`
    window.open(previewUrl, "_blank")
  }, [page, storeFrontUrl])

  const toggleFullscreen = useCallback(() => {
    if (!editor) return
    const cmd = "fullscreen"
    if (isFullscreen) {
      editor.stopCommand(cmd)
    } else {
      editor.runCommand(cmd)
    }
    setIsFullscreen(!isFullscreen)
  }, [editor, isFullscreen])

  const openCodeView = useCallback(() => {
    if (!editor) return
    setCodeHtml(editor.getHtml() || "")
    setCodeCss(editor.getCss() || "")
    setShowCodeModal(true)
  }, [editor])

  return (
    <>
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
                onClick={onNavigateBack}
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
                Editing Template: {editorModeName}
              </span>
            </>
          )}
        </div>

        {/* Center — Editor Actions + Device Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Undo / Redo */}
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              style={iconBtn(false, !canUndo)}
              onMouseEnter={(e) => { if (canUndo) { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" } }}
              onMouseLeave={(e) => { if (canUndo) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999" } }}
              title="Undo (Ctrl+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10h13a4 4 0 010 8H7" />
                <polyline points="7 6 3 10 7 14" />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              style={iconBtn(false, !canRedo)}
              onMouseEnter={(e) => { if (canRedo) { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" } }}
              onMouseLeave={(e) => { if (canRedo) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999" } }}
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10H8a4 4 0 000 8h9" />
                <polyline points="17 6 21 10 17 14" />
              </svg>
            </button>
          </div>

          <div style={{ width: 1, height: 18, background: "#e8e8e8" }} />

          {/* Outlines toggle */}
          <button
            onClick={toggleOutlines}
            style={iconBtn(outlinesOn)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" }}
            onMouseLeave={(e) => { if (!outlinesOn) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999" } else { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" } }}
            title="Toggle component outlines"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
          </button>

          {/* Preview — opens storefront in new tab */}
          <button
            onClick={openPreview}
            style={iconBtn(false)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999" }}
            title="Preview in new tab"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            style={iconBtn(isFullscreen)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" }}
            onMouseLeave={(e) => { if (!isFullscreen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999" } else { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" } }}
            title="Fullscreen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <path d="M4 14h6v6" />
                  <path d="M20 10h-6V4" />
                  <path d="M14 10l7-7" />
                  <path d="M3 21l7-7" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
          </button>

          {/* Code view */}
          <button
            onClick={openCodeView}
            style={iconBtn(false)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999" }}
            title="View code (HTML/CSS)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>

          {/* Device Switcher */}
          {editorMode === "page" && (
            <>
              <div style={{ width: 1, height: 18, background: "#e8e8e8" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#f3f3f3", borderRadius: 8, padding: 2 }}>
                {([
                  { name: "Desktop" as const, icon: `<rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` },
                  { name: "Tablet" as const, icon: `<rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` },
                  { name: "Mobile" as const, icon: `<rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` },
                ]).map((d) => (
                  <button
                    key={d.name}
                    onClick={() => {
                      onDeviceChange(d.name)
                      if (editor) editor.setDevice(d.name)
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
            </>
          )}
        </div>

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
                onClick={onShowFigma}
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
                onClick={onSave}
                disabled={isSaving}
                style={toolbarBtn("secondary")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              {page.status === "draft" ? (
                <button
                  onClick={onPublish}
                  disabled={isPublishing}
                  style={toolbarBtn("primary")}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#007acc" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#0099ff" }}
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </button>
              ) : (
                <button
                  onClick={onUnpublish}
                  disabled={isUnpublishing}
                  style={toolbarBtn("secondary")}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
                >
                  {isUnpublishing ? "..." : "Unpublish"}
                </button>
              )}
            </>
          ) : (
            <>
              {/* Template mode buttons */}
              <button
                onClick={onCancelTemplate}
                style={toolbarBtn("secondary")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#333" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666" }}
              >
                Cancel
              </button>
              <button
                onClick={onDoneTemplate}
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

      {/* Code View Modal */}
      {showCodeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowCodeModal(false)}
        >
          <div
            style={{
              background: "#1e1e1e",
              borderRadius: 12,
              width: "80vw",
              maxWidth: 900,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #333",
              }}
            >
              <span style={{ color: "#ccc", fontSize: 13, fontWeight: 600 }}>
                Code Export
              </span>
              <button
                onClick={() => setShowCodeModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Code content */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* HTML */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #333" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#e06c75", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>HTML</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(codeHtml)}
                    style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}
                  >
                    Copy
                  </button>
                </div>
                <pre
                  style={{
                    flex: 1,
                    overflow: "auto",
                    margin: 0,
                    padding: 12,
                    color: "#d4d4d4",
                    fontSize: 12,
                    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {codeHtml}
                </pre>
              </div>
              {/* CSS */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#61afef", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>CSS</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(codeCss)}
                    style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 11 }}
                  >
                    Copy
                  </button>
                </div>
                <pre
                  style={{
                    flex: 1,
                    overflow: "auto",
                    margin: 0,
                    padding: 12,
                    color: "#d4d4d4",
                    fontSize: 12,
                    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {codeCss}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
