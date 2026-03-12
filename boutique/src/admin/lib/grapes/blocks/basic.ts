import type { Editor } from "grapesjs"

export function registerBasicBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("heading", {
    label: "Heading",
    category: "Basic",
    content: { type: "cms-heading" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h8"/></svg>',
  })

  bm.add("rich-text", {
    label: "Rich Text",
    category: "Basic",
    content: { type: "cms-rich-text" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 10h16M4 14h10M4 18h14"/></svg>',
  })

  bm.add("spacer", {
    label: "Spacer",
    category: "Basic",
    content: { type: "cms-spacer" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>',
  })

  bm.add("divider", {
    label: "Divider",
    category: "Basic",
    content: { type: "cms-divider" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="12" x2="21" y2="12"/></svg>',
  })
}
