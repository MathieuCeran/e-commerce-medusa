import type { Editor } from "grapesjs"

type MenuItem = {
  label?: string
  action?: string
  color?: string
  bold?: boolean
  separator?: boolean
}

export function contextMenuPlugin(editor: Editor) {
  let menuEl: HTMLElement | null = null
  let selectedComponent: any = null

  function createMenu() {
    const el = document.createElement("div")
    el.id = "gjs-context-menu"
    el.style.cssText = `
      position:fixed; z-index:9999; display:none;
      background:#fff; border:1px solid #e8e8e8; border-radius:10px;
      padding:6px; min-width:180px;
      box-shadow:0 8px 24px rgba(0,0,0,0.08);
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
      font-size:13px;
    `
    document.body.appendChild(el)
    return el
  }

  function hideMenu() {
    if (menuEl) menuEl.style.display = "none"
  }

  function showMenu(x: number, y: number, items: MenuItem[]) {
    if (!menuEl) menuEl = createMenu()
    menuEl.innerHTML = items
      .map((item) => {
        if (item.separator)
          return `<div style="border-top:1px solid #f0f0f0;margin:4px 0;"></div>`
        return `<div class="ctx-item" data-action="${item.action}"
          style="padding:7px 12px;border-radius:6px;cursor:pointer;color:${item.color || "#333"};
          font-weight:${item.bold ? "500" : "400"};transition:background 0.1s;"
          onmouseenter="this.style.background='#f5f5f5'"
          onmouseleave="this.style.background='transparent'"
        >${item.label}</div>`
      })
      .join("")

    menuEl.style.left = x + "px"
    menuEl.style.top = y + "px"
    menuEl.style.display = "block"

    menuEl.querySelectorAll(".ctx-item").forEach((el) => {
      el.addEventListener("click", () => {
        const action = (el as HTMLElement).dataset.action
        if (action) editor.trigger("context-menu:" + action, selectedComponent)
        hideMenu()
      })
    })
  }

  // Listen for right-click on canvas iframe.
  // NOTE: GrapeJS does NOT have a native "component:contextmenu" event.
  // We intercept the raw DOM contextmenu event on the canvas iframe document.
  const attachContextMenu = () => {
    const frameDoc = editor.Canvas.getFrameEl()?.contentDocument
    if (!frameDoc) return
    frameDoc.addEventListener("contextmenu", (e: MouseEvent) => {
      e.preventDefault()
      const target = e.target as HTMLElement
      // Walk up to find a GrapeJS component wrapper
      let el: HTMLElement | null = target
      let comp: any = null
      while (el && !comp) {
        comp = (el as any).__gjsv?.model || null
        if (!comp) el = el.parentElement
      }
      if (!comp) return

      selectedComponent = comp

      const isTpl = comp.get("_tpl")
      const mode = (editor as any).__editorMode || "page"

      const items: MenuItem[] = [
        { label: "Selectionner le parent", action: "select-parent" },
        { label: "Copier", action: "copy" },
        { label: "Dupliquer", action: "duplicate" },
        { separator: true },
      ]

      if (mode === "page" && !isTpl) {
        items.push({
          label: "Ajouter au template \u2191",
          action: "promote",
          color: "#0099ff",
          bold: true,
        })
        items.push({ separator: true })
      }

      if (
        mode === "template" &&
        !comp.get("type")?.includes("content-placeholder")
      ) {
        items.push({
          label: "Retirer du template \u2193",
          action: "demote",
          color: "#ff9500",
          bold: true,
        })
        items.push({ separator: true })
      }

      if (!isTpl) {
        items.push({ label: "Supprimer", action: "delete", color: "#ff3b30" })
      }

      // Convert iframe coords to page coords
      const frame = editor.Canvas.getFrameEl()
      const rect = frame?.getBoundingClientRect()
      const x = (rect?.left || 0) + e.clientX
      const y = (rect?.top || 0) + e.clientY

      showMenu(x, y, items)
    })
  }
  editor.on("canvas:frame:load", attachContextMenu)
  attachContextMenu()

  // Handle built-in actions
  editor.on("context-menu:select-parent", (comp: any) => {
    const parent = comp.parent()
    if (parent) editor.select(parent)
  })
  editor.on("context-menu:copy", () => editor.runCommand("core:copy"))
  editor.on("context-menu:duplicate", () => editor.runCommand("tlb-clone"))
  editor.on("context-menu:delete", (comp: any) => comp.remove())

  // Close on click outside / Escape
  const onDocClick = () => hideMenu()
  const onDocKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") hideMenu()
  }
  document.addEventListener("click", onDocClick)
  document.addEventListener("keydown", onDocKeydown)

  // Cleanup on editor destroy to prevent listener leaks
  editor.on("destroy", () => {
    document.removeEventListener("click", onDocClick)
    document.removeEventListener("keydown", onDocKeydown)
    menuEl?.remove()
    menuEl = null
  })
}
