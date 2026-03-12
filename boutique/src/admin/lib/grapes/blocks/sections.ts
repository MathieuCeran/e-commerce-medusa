import type { Editor } from "grapesjs"

export function registerSectionBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("hero", {
    label: "Hero",
    category: "Sections",
    content: { type: "cms-hero" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="14" y2="14"/></svg>',
  })

  bm.add("cta", {
    label: "Call to Action",
    category: "Sections",
    content: { type: "cms-cta" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 15h4M8 11h8"/></svg>',
  })

  bm.add("features", {
    label: "Features",
    category: "Sections",
    content: { type: "cms-features" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  })

  bm.add("faq", {
    label: "FAQ",
    category: "Sections",
    content: { type: "cms-faq" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 015.12-2.13A3 3 0 0112 13v1M12 17h.01"/></svg>',
  })

  bm.add("image-text", {
    label: "Image & Texte",
    category: "Sections",
    content: { type: "cms-image-text" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="8" height="18" rx="1"/><path d="M15 7h6M15 11h6M15 15h4"/></svg>',
  })

  bm.add("card-grid", {
    label: "Grille de cartes",
    category: "Sections",
    content: { type: "cms-card-grid" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="6" height="9" rx="1"/><rect x="9" y="3" width="6" height="9" rx="1"/><rect x="16" y="3" width="6" height="9" rx="1"/></svg>',
  })
}
