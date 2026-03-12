import type { Editor } from "grapesjs"

export function registerMediaBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("image-block", {
    label: "Image",
    category: "Media",
    content: `<figure style="padding:32px 24px;text-align:center;">
      <img src="https://placehold.co/800x400" alt="Image description" style="max-width:100%;height:auto;border-radius:8px;" />
      <figcaption style="margin-top:8px;font-size:14px;color:#6b7280;"></figcaption>
    </figure>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  })

  bm.add("video-embed", {
    label: "Video Embed",
    category: "Media",
    content: `<div data-component="video-embed" data-url="" data-autoplay="false" style="position:relative;padding-top:56.25%;background:#0f172a;border-radius:8px;overflow:hidden;">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#ffffff" stroke="none"/></svg>
        <p style="color:#94a3b8;font-size:14px;text-align:center;margin:0;">Configurez l'URL de la video dans les parametres</p>
      </div>
    </div>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  })

  // Custom component type for video-embed traits
  editor.DomComponents.addType("video-embed", {
    isComponent: (el) =>
      el.getAttribute?.("data-component") === "video-embed",
    model: {
      defaults: {
        traits: [
          {
            type: "text",
            name: "data-url",
            label: "URL de la vidéo",
          },
          {
            type: "checkbox",
            name: "data-autoplay",
            label: "Lecture automatique",
          },
        ],
      },
    },
  })

  bm.add("image-gallery", {
    label: "Image Gallery",
    category: "Media",
    content: `<section style="padding:40px;">
      <div data-columns="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
        <div style="aspect-ratio:4/3;background:#f3f4f6;border-radius:8px;overflow:hidden;"><img src="https://placehold.co/400x300" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
        <div style="aspect-ratio:4/3;background:#f3f4f6;border-radius:8px;overflow:hidden;"><img src="https://placehold.co/400x300" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
        <div style="aspect-ratio:4/3;background:#f3f4f6;border-radius:8px;overflow:hidden;"><img src="https://placehold.co/400x300" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
        <div style="aspect-ratio:4/3;background:#f3f4f6;border-radius:8px;overflow:hidden;"><img src="https://placehold.co/400x300" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
        <div style="aspect-ratio:4/3;background:#f3f4f6;border-radius:8px;overflow:hidden;"><img src="https://placehold.co/400x300" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
        <div style="aspect-ratio:4/3;background:#f3f4f6;border-radius:8px;overflow:hidden;"><img src="https://placehold.co/400x300" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  })

  bm.add("logo-cloud", {
    label: "Logo Cloud",
    category: "Media",
    content: `<section style="padding:64px 24px;background:#f9fafb;">
      <div style="max-width:1280px;margin:0 auto;text-align:center;">
        <h3 style="font-size:16px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:40px;">Ils nous font confiance</h3>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:40px;">
          <img src="https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand" alt="Brand" style="height:40px;width:auto;filter:grayscale(1);opacity:0.5;" />
          <img src="https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand" alt="Brand" style="height:40px;width:auto;filter:grayscale(1);opacity:0.5;" />
          <img src="https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand" alt="Brand" style="height:40px;width:auto;filter:grayscale(1);opacity:0.5;" />
          <img src="https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand" alt="Brand" style="height:40px;width:auto;filter:grayscale(1);opacity:0.5;" />
          <img src="https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand" alt="Brand" style="height:40px;width:auto;filter:grayscale(1);opacity:0.5;" />
          <img src="https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand" alt="Brand" style="height:40px;width:auto;filter:grayscale(1);opacity:0.5;" />
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="8" height="4" rx="1"/><rect x="14" y="7" width="8" height="4" rx="1"/><rect x="2" y="14" width="8" height="4" rx="1"/><rect x="14" y="14" width="8" height="4" rx="1"/></svg>',
  })
}
