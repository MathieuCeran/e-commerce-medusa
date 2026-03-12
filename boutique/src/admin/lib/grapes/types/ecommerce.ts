import type { Editor } from "grapesjs"

export function registerEcommerceTypes(editor: Editor) {
  editor.Components.addType("products-grid", {
    isComponent: (el) => el.getAttribute?.("data-component") === "products-grid",
    model: {
      defaults: {
        tagName: "section",
        name: "Products Grid",
        droppable: false,
        attributes: { "data-component": "products-grid" },
        traits: [
          { type: "text", name: "data-collection", label: "Collection Handle" },
          { type: "number", name: "data-limit", label: "Nombre de produits", default: 4, min: 1, max: 12 },
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
          { type: "checkbox", name: "data-show-view-all", label: 'Afficher "Voir tout"' },
        ],
        resizable: { tl: 1, tr: 1, bl: 1, br: 1, tc: 1, bc: 1, ml: 1, mr: 1 },
      },
    },
  })
}
