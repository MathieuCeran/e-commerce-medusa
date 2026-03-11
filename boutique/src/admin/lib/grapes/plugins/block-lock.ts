import type { Editor } from "grapesjs"

// Lock a component and all its children
export function lockComponent(comp: any, isRoot = true) {
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
export function unlockComponent(comp: any) {
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

export function blockLockPlugin(editor: Editor) {
  // Expose functions on the editor for external use
  ;(editor as any).__blockLock = { lockComponent, unlockComponent }
}
