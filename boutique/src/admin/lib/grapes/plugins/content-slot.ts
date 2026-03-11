import type { Editor } from "grapesjs"

export function contentSlotPlugin(editor: Editor) {
  editor.DomComponents.addType("content-placeholder", {
    isComponent: (el) =>
      el.getAttribute?.("data-type") === "content-placeholder",
    model: {
      defaults: {
        tagName: "div",
        droppable: false,
        copyable: false,
        removable: false,
        draggable: true,
        selectable: true,
        hoverable: true,
        badgable: false,
        layerable: true,
        highlightable: false,
        attributes: { "data-type": "content-placeholder" },
        components: [],
        traits: [],
        style: {
          "min-height": "400px",
          background: "rgba(168, 85, 247, 0.08)",
          border: "2px dashed rgba(168, 85, 247, 0.35)",
          "border-radius": "12px",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          padding: "64px 24px",
          margin: "0",
          width: "100%",
        },
      },
      init() {
        this.set("custom-name", "Content Zone")
      },
      toHTML() {
        return "" // Placeholder is never rendered in final HTML
      },
    },
    view: {
      onRender({ el }: { el: HTMLElement }) {
        el.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;user-select:none;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="rgba(168,85,247,0.5)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18M3 9h6M3 15h6"/>
            </svg>
            <span style="color:rgba(168,85,247,0.7);font-size:13px;font-weight:600;letter-spacing:0.02em;">
              Placeholder
            </span>
            <span style="color:rgba(168,85,247,0.45);font-size:11px;text-align:center;line-height:1.4;">
              Your page content<br/>will appear here.
            </span>
          </div>
        `
      },
    },
  })
}

/**
 * Prevent duplicate content-placeholder via drag or any other add mechanism.
 */
export function guardContentPlaceholderDuplicates(editor: Editor): void {
  editor.on("component:add", (component: any) => {
    if (component.get("type") !== "content-placeholder") return
    const wrapper = editor.getWrapper()
    const existing = wrapper
      ?.components()
      .filter(
        (c: any) =>
          c.get("type") === "content-placeholder" && c !== component
      )
    if (existing && existing.length > 0) {
      component.remove()
    }
  })
}

export function addContentPlaceholder(
  editor: Editor,
  atIndex?: number
): any {
  const wrapper = editor.getWrapper()
  if (!wrapper) return null
  const existing = wrapper
    .components()
    .models.some((c: any) => c.get("type") === "content-placeholder")
  if (existing) return null
  return wrapper
    .components()
    .add(
      { type: "content-placeholder" },
      atIndex !== undefined ? { at: atIndex } : undefined
    )
}

export function getContentPlaceholderIndex(editor: Editor): number {
  const wrapper = editor.getWrapper()
  if (!wrapper) return -1
  const models = wrapper.components().models
  for (let i = 0; i < models.length; i++) {
    if (models[i].get("type") === "content-placeholder") return i
  }
  return -1
}
