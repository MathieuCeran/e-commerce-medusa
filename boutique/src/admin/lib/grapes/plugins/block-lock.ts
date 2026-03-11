import type { Editor } from "grapesjs"

export function blockLockPlugin(editor: Editor) {
  // Lock a component and all its children
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
      // Ensure every template root block has a stable UUID for cross-mode identification
      if (!comp.getAttributes()["data-tpl-block-id"]) {
        comp.addAttributes({ "data-tpl-block-id": crypto.randomUUID() })
      }
    }
    comp.components().forEach((child: any) => lockComponent(child, false))
  }

  // Unlock a component and all its children
  function unlockComponent(comp: any) {
    comp.set({
      locked: false,
      selectable: true,
      hoverable: true,
      editable: true,
      draggable: true,
      removable: true,
      copyable: true,
      highlightable: true,
      _tpl: false,
    })
    comp.removeAttributes("data-tpl-locked")
    comp.components().forEach((child: any) => unlockComponent(child))
  }

  // Double-click on locked block → emit event to switch to template mode.
  // NOTE: We use raw DOM event because GrapeJS does NOT fire component:dblclick
  // on components with selectable:false. We intercept directly on the canvas iframe.
  const attachDblClick = () => {
    const frameDoc = editor.Canvas.getFrameEl()?.contentDocument
    if (!frameDoc) return
    frameDoc.addEventListener("dblclick", (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-tpl-locked]")
      if (target) {
        const blockId = target.getAttribute("data-tpl-block-id")
        if (blockId) {
          editor.trigger("template:edit-request", { componentId: blockId })
        }
      }
    })
  }
  // Canvas iframe may reload, so attach on every frame load
  editor.on("canvas:frame:load", attachDblClick)
  // Also attach immediately if frame is already loaded
  attachDblClick()

  // Expose functions on the editor for external use
  ;(editor as any).__blockLock = { lockComponent, unlockComponent }
}
