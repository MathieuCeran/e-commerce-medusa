import type { Editor } from "grapesjs"

export function templateSyncPlugin(editor: Editor) {
  // Promote: move a page block into the template
  editor.on("context-menu:promote", (component: any) => {
    editor.trigger("template:promote-request", { component })
  })

  // Demote: remove a block from the template
  editor.on("context-menu:demote", (component: any) => {
    editor.trigger("template:demote-request", { component })
  })
}

/**
 * Calculate where to insert a promoted block in component_data.
 * Returns { insertIndex, newContentPosition }.
 */
export function computePromotePosition(
  componentIndex: number,
  contentPosition: number,
  pageComponentCount: number
): { insertIndex: number; newContentPosition: number } {
  if (componentIndex < contentPosition) {
    // Block is above the content slot → insert at same index, shift content_position
    return {
      insertIndex: componentIndex,
      newContentPosition: contentPosition + 1,
    }
  } else if (componentIndex >= contentPosition + pageComponentCount) {
    // Block is below the content slot → insert after content in template data
    const relativeIndex = componentIndex - contentPosition - pageComponentCount
    return {
      insertIndex: contentPosition + relativeIndex,
      newContentPosition: contentPosition,
    }
  } else {
    // Block is within the page content range — should not be promoted via this path
    throw new Error("Cannot promote: component is within page content range")
  }
}

/**
 * Recalculate content_position after demoting (removing) a block from template.
 */
export function computeDemotePosition(
  removedIndex: number,
  contentPosition: number
): number {
  if (removedIndex < contentPosition) {
    return contentPosition - 1
  }
  return contentPosition
}
