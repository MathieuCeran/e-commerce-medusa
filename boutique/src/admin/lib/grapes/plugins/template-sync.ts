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
 *
 * The wrapper in page mode contains:
 *   [template_before_0..N] [page_0..M] [template_after_0..K]
 * where contentPosition = N (number of template blocks before content).
 *
 * Page blocks are in the range [contentPosition, contentPosition + pageComponentCount).
 * Promoting a page block places it at the content boundary in template data:
 *   - First half of page content → before content (content_position increments)
 *   - Second half → after content (content_position stays)
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
    // Block is within the page content range — promote it to template
    const pageRelativeIndex = componentIndex - contentPosition
    const inFirstHalf = pageRelativeIndex < pageComponentCount / 2
    return {
      insertIndex: contentPosition,
      newContentPosition: inFirstHalf ? contentPosition + 1 : contentPosition,
    }
  }
}
