import type { Editor } from "grapesjs"

export function registerEcommerceBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("products-grid", {
    label: "Products Grid",
    category: "E-commerce",
    content: `<section data-component="products-grid" data-collection="" data-limit="4" data-columns="4" data-show-view-all="true" style="padding:64px 24px;background:#ffffff;">
      <div style="max-width:1280px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;">
          <div>
            <h2 style="font-size:28px;font-weight:700;color:#111827;">Featured Products</h2>
            <p style="margin-top:8px;color:#6b7280;">Check out our latest arrivals</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;">
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 1</div>
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 2</div>
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 3</div>
          <div style="background:#f3f4f6;border-radius:8px;height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product 4</div>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  })

  // Custom component type for products-grid traits
  editor.DomComponents.addType("products-grid", {
    isComponent: (el) =>
      el.getAttribute?.("data-component") === "products-grid",
    model: {
      defaults: {
        traits: [
          {
            type: "text",
            name: "data-collection",
            label: "Collection Handle",
          },
          {
            type: "number",
            name: "data-limit",
            label: "Nombre de produits",
            default: 4,
            min: 1,
            max: 12,
          },
          {
            type: "select",
            name: "data-columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "4",
          },
          {
            type: "checkbox",
            name: "data-show-view-all",
            label: 'Afficher "Voir tout"',
          },
        ],
        resizable: {
          tl: 1,
          tr: 1,
          bl: 1,
          br: 1,
          tc: 1,
          bc: 1,
          ml: 1,
          mr: 1,
        },
      },
    },
  })
}
