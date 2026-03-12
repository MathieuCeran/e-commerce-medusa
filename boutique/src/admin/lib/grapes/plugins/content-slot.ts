import type { Editor } from "grapesjs"

export function contentSlotPlugin(editor: Editor) {
  // Content zone: invisible wrapper around page content in page mode.
  // Only this zone is droppable — template blocks and the main wrapper are not.
  editor.DomComponents.addType("content-zone", {
    model: {
      defaults: {
        tagName: "div",
        droppable: true,
        removable: false,
        copyable: false,
        draggable: false,
        selectable: false,
        hoverable: false,
        highlightable: false,
        badgable: false,
        layerable: false,
        attributes: { "data-content-zone": "true" },
        style: {
          width: "100%",
          padding: "0",
          margin: "0",
          "min-height": "60px",
        },
      },
      init() {
        this.set("custom-name", "Content Zone")
      },
    },
    view: {
      onRender({ el, model }: { el: HTMLElement; model: any }) {
        let placeholderEl: HTMLElement | null = null
        let pendingUpdate: ReturnType<typeof setTimeout> | null = null

        const createPlaceholder = () => {
          const ph = document.createElement("div")
          ph.setAttribute("data-cz-placeholder", "true")
          ph.style.cssText = `
            min-height:220px; padding:48px 24px; margin:0;
            border:2px dashed rgba(99,102,241,0.3); border-radius:12px;
            background:rgba(99,102,241,0.03);
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
            pointer-events:none; user-select:none;
          `
          ph.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="rgba(99,102,241,0.4)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span style="color:rgba(99,102,241,0.55);font-size:13px;font-weight:600;font-family:-apple-system,system-ui,sans-serif;">
              Glissez vos blocs ici
            </span>
            <span style="color:rgba(99,102,241,0.35);font-size:11px;font-family:-apple-system,system-ui,sans-serif;">
              Zone de contenu de la page
            </span>
          `
          return ph
        }

        const doUpdate = () => {
          const hasChildren = model.components().length > 0
          if (!hasChildren && !placeholderEl) {
            placeholderEl = createPlaceholder()
            el.appendChild(placeholderEl)
          } else if (hasChildren && placeholderEl) {
            placeholderEl.remove()
            placeholderEl = null
          }
        }

        // Debounce to handle rapid add/remove cycles from the GrapesJS
        // sorter during drag (ghost components added then removed).
        const debouncedUpdate = () => {
          if (pendingUpdate !== null) clearTimeout(pendingUpdate)
          pendingUpdate = setTimeout(doUpdate, 80)
        }

        model.components().on("add remove reset", debouncedUpdate)
        doUpdate()
      },
    },
  })

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
        this.set("custom-name", "Content Placeholder")
      },
      toHTML() {
        return "<!-- CMS_CONTENT_PLACEHOLDER -->"
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

/**
 * Find the content-zone component in the wrapper (if any).
 */
export function getContentZone(editor: Editor): any | null {
  const wrapper = editor.getWrapper()
  if (!wrapper) return null
  return (
    wrapper
      .components()
      .models.find((c: any) => c.get("type") === "content-zone") || null
  )
}

/**
 * Get page content component models (handles both content-zone and flat wrapper).
 */
export function getPageContentModels(editor: Editor): any[] {
  const zone = getContentZone(editor)
  if (zone) {
    return zone.components().models.slice()
  }
  const wrapper = editor.getWrapper()
  if (!wrapper) return []
  return wrapper
    .components()
    .models.filter(
      (c: any) =>
        !c.get("_tpl") &&
        c.get("type") !== "content-placeholder" &&
        c.get("type") !== "content-zone"
    )
}
