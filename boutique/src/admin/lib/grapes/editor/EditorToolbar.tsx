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

export type EditorToolbarFullProps = EditorToolbarProps & {
  editorModeName: string
  success: string
  errorMsg: string
  isSavingTemplate?: boolean
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
  return (
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
  )
}
