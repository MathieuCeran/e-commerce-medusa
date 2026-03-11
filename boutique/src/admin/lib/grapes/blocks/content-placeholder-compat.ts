// Temporary compat file — these functions move to plugins/content-slot.ts in Chunk 3
import type { Editor } from "grapesjs"

export function hasContentPlaceholder(editor: Editor): boolean {
  const wrapper = editor.getWrapper()
  if (!wrapper) return false
  return wrapper
    .components()
    .models.some((c: any) => c.get("type") === "content-placeholder")
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

export function addContentPlaceholder(
  editor: Editor,
  atIndex?: number
): any {
  if (hasContentPlaceholder(editor)) return null
  const wrapper = editor.getWrapper()
  if (!wrapper) return null
  return wrapper
    .components()
    .add(
      { type: "content-placeholder" },
      atIndex !== undefined ? { at: atIndex } : undefined
    )
}
