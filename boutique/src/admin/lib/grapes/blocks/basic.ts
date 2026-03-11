import type { Editor } from "grapesjs"

export function registerBasicBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("heading", {
    label: "Heading",
    category: "Basic",
    content: `<div style="padding:32px 24px;">
      <h2 style="font-size:32px;font-weight:700;color:#111827;text-align:center;">Section Title</h2>
    </div>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h8"/></svg>',
  })

  bm.add("rich-text", {
    label: "Rich Text",
    category: "Basic",
    content: `<div style="padding:48px 24px;max-width:800px;margin:0 auto;">
      <h2 style="font-size:28px;font-weight:700;color:#111827;margin-bottom:16px;">Your Heading</h2>
      <p style="font-size:16px;color:#4b5563;line-height:1.7;">Write your content here. This is a rich text block where you can add paragraphs of text with a heading above.</p>
    </div>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 10h16M4 14h10M4 18h14"/></svg>',
  })

  bm.add("image-block", {
    label: "Image",
    category: "Basic",
    content: `<figure style="padding:32px 24px;text-align:center;">
      <img src="https://placehold.co/800x400" alt="Image description" style="max-width:100%;height:auto;border-radius:8px;" />
      <figcaption style="margin-top:8px;font-size:14px;color:#6b7280;"></figcaption>
    </figure>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  })

  bm.add("spacer", {
    label: "Spacer",
    category: "Basic",
    content: `<div style="height:48px;"></div>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>',
  })

  bm.add("divider", {
    label: "Divider",
    category: "Basic",
    content: `<div style="padding:24px;">
      <hr style="border:none;border-top:1px solid #e5e7eb;max-width:100%;margin:0 auto;" />
    </div>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="12" x2="21" y2="12"/></svg>',
  })
}
