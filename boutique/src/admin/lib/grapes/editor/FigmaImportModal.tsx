import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { sdk } from "../../client"

export type FigmaImportModalProps = {
  onClose: () => void
  onImport: (html: string, css: string) => void
}

export function FigmaImportModal({ onClose, onImport }: FigmaImportModalProps) {
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
