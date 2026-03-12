import type { Editor } from "grapesjs"

export function registerNavigationTypes(editor: Editor) {
  editor.Components.addType("site-header", {
    isComponent: (el) => el.getAttribute?.("data-component") === "site-header",
    model: {
      defaults: {
        tagName: "header",
        name: "Header",
        droppable: false,
        attributes: { "data-component": "site-header" },
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { id: "simple", label: "Simple" },
              { id: "ecommerce", label: "E-commerce" },
              { id: "minimal", label: "Minimal" },
            ],
            default: "simple",
          },
        ],
      },
    },
  })

  editor.Components.addType("site-footer", {
    isComponent: (el) => el.getAttribute?.("data-component") === "site-footer",
    model: {
      defaults: {
        tagName: "footer",
        name: "Footer",
        droppable: false,
        attributes: { "data-component": "site-footer" },
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { id: "full", label: "Complet" },
              { id: "minimal", label: "Minimal" },
            ],
            default: "full",
          },
        ],
      },
    },
  })
}
