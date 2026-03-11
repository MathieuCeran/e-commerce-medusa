import type { EditorRightPanelProps } from "../types"

export type EditorRightPanelFullProps = EditorRightPanelProps & {
  activeRightTab: "style" | "traits" | "layers"
  onTabChange: (tab: "style" | "traits" | "layers") => void
}

export function EditorRightPanel({
  editor,
  editorMode,
  layouts,
  activeLayoutId,
  onLayoutChange,
  onToggleMode,
  onCreateTemplate,
  onDeleteLayout,
  activeRightTab,
  onTabChange,
}: EditorRightPanelFullProps) {
  return (
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
            onClick={() => onTabChange(tab.id)}
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
          value={activeLayoutId || ""}
          onChange={(e) => onLayoutChange(e.target.value || null)}
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

        {activeLayoutId && (
          <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
            <button
              onClick={onToggleMode}
              style={{
                flex: 1,
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
            <button
              onClick={() => {
                if (!activeLayoutId) return
                const confirmed = window.confirm(
                  "Supprimer ce template ? Les pages l'utilisant perdront leur layout."
                )
                if (confirmed) onDeleteLayout(activeLayoutId)
              }}
              style={{
                padding: "6px 10px",
                background: "transparent",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                color: "#ccc",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ff3b30"
                e.currentTarget.style.color = "#ff3b30"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e0e0e0"
                e.currentTarget.style.color = "#ccc"
              }}
              title="Supprimer ce template"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        )}

        <button
          onClick={() => {
            const name = prompt("Template name:")
            if (!name?.trim()) return
            onCreateTemplate(name.trim())
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
    </div>
  )
}
