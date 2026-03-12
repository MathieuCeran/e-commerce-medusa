import type { Editor } from "grapesjs"

export function registerMediaTypes(editor: Editor) {
  // ─── Image ──────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-image", {
    isComponent: (el) => el.tagName === "FIGURE" && el.classList?.contains("cms-image"),
    model: {
      defaults: {
        tagName: "figure",
        classes: ["cms-image"],
        name: "Image",
        droppable: false,
        traits: [],
        components: [
          { tagName: "img", classes: ["cms-image__img"], attributes: { src: "https://placehold.co/800x400", alt: "Image description" } },
          { tagName: "figcaption", classes: ["cms-image__caption"], content: "", editable: true },
        ],
        styles: `
          .cms-image { padding: 32px 24px; text-align: center; }
          .cms-image__img { max-width: 100%; height: auto; border-radius: 8px; }
          .cms-image__caption { margin-top: 8px; font-size: 14px; color: #6b7280; }
        `,
      },
    },
  })

  // ─── Video Embed (hydrated) ─────────────────────────────────────────────────
  editor.Components.addType("video-embed", {
    isComponent: (el) => el.getAttribute?.("data-component") === "video-embed",
    model: {
      defaults: {
        tagName: "div",
        name: "Video Embed",
        droppable: false,
        attributes: { "data-component": "video-embed", "data-url": "", "data-autoplay": "false" },
        traits: [
          { type: "text", name: "data-url", label: "URL de la video" },
          { type: "checkbox", name: "data-autoplay", label: "Lecture automatique" },
        ],
        components: [
          {
            tagName: "div",
            classes: ["video-embed__placeholder"],
            components: [
              { tagName: "p", content: "Configurez l'URL de la video dans les parametres" },
            ],
          },
        ],
        styles: `
          [data-component="video-embed"] { position: relative; padding-top: 56.25%; background: #0f172a; border-radius: 8px; overflow: hidden; }
          .video-embed__placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #94a3b8; font-size: 14px; text-align: center; }
        `,
      },
    },
  })

  // ─── Image Gallery ──────────────────────────────────────────────────────────
  editor.Components.addType("cms-image-gallery", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-image-gallery"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-image-gallery"],
        name: "Image Gallery",
        droppable: false,
        traits: [
          {
            type: "select",
            name: "columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "3",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-image-gallery__grid"],
            components: Array.from({ length: 6 }, () => ({
              tagName: "div",
              classes: ["cms-image-gallery__item"],
              components: [
                { tagName: "img", attributes: { src: "https://placehold.co/400x300", alt: "" }, classes: ["cms-image-gallery__img"] },
              ],
            })),
          },
        ],
        styles: `
          .cms-image-gallery { padding: 40px; }
          .cms-image-gallery__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .cms-image-gallery__item { aspect-ratio: 4/3; background: #f3f4f6; border-radius: 8px; overflow: hidden; }
          .cms-image-gallery__img { width: 100%; height: 100%; object-fit: cover; }
        `,
      },
      init() {
        this.on("change:columns", this.onColumnsChange)
      },
      onColumnsChange() {
        const grid = this.find(".cms-image-gallery__grid")[0]
        if (grid) {
          grid.setStyle({ "grid-template-columns": `repeat(${this.get("columns") || 3}, 1fr)` })
        }
      },
    },
  })

  // ─── Logo Cloud ─────────────────────────────────────────────────────────────
  editor.Components.addType("cms-logo-cloud", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-logo-cloud"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-logo-cloud"],
        name: "Logo Cloud",
        droppable: false,
        traits: [],
        components: [
          {
            tagName: "div",
            classes: ["cms-logo-cloud__inner"],
            components: [
              { tagName: "h3", classes: ["cms-logo-cloud__title"], content: "Ils nous font confiance", editable: true },
              {
                tagName: "div",
                classes: ["cms-logo-cloud__grid"],
                components: Array.from({ length: 6 }, () => ({
                  tagName: "img",
                  classes: ["cms-logo-cloud__logo"],
                  attributes: { src: "https://placehold.co/120x40/e5e7eb/9ca3af?text=Brand", alt: "Brand" },
                })),
              },
            ],
          },
        ],
        styles: `
          .cms-logo-cloud { padding: 64px 24px; background: #f9fafb; }
          .cms-logo-cloud__inner { max-width: 1280px; margin: 0 auto; text-align: center; }
          .cms-logo-cloud__title { font-size: 16px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 40px 0; }
          .cms-logo-cloud__grid { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 40px; }
          .cms-logo-cloud__logo { height: 40px; width: auto; filter: grayscale(1); opacity: 0.5; }
        `,
      },
    },
  })
}
