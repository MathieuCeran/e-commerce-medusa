import type { Editor } from "grapesjs"

export function registerMediaBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("image", {
    label: "Image",
    category: "Media",
    content: { type: "cms-image" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  })

  bm.add("video-embed", {
    label: "Video Embed",
    category: "Media",
    content: { type: "video-embed" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  })

  bm.add("image-gallery", {
    label: "Image Gallery",
    category: "Media",
    content: { type: "cms-image-gallery" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  })

  bm.add("logo-cloud", {
    label: "Logo Cloud",
    category: "Media",
    content: { type: "cms-logo-cloud" },
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="8" height="4" rx="1"/><rect x="14" y="7" width="8" height="4" rx="1"/><rect x="2" y="14" width="8" height="4" rx="1"/><rect x="14" y="14" width="8" height="4" rx="1"/></svg>',
  })

  // addType calls REMOVED — moved to types/media.ts
}
