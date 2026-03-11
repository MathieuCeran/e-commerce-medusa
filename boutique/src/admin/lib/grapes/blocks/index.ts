import type { Editor } from "grapesjs"
import { registerSectionBlocks } from "./sections"
import { registerBasicBlocks } from "./basic"
import { registerEcommerceBlocks } from "./ecommerce"

const SEMANTIC_TAGS = [
  { id: "div", label: "div" },
  { id: "section", label: "section" },
  { id: "header", label: "header" },
  { id: "footer", label: "footer" },
  { id: "nav", label: "nav" },
  { id: "main", label: "main" },
  { id: "article", label: "article" },
  { id: "aside", label: "aside" },
  { id: "figure", label: "figure" },
  { id: "figcaption", label: "figcaption" },
]

const TEXT_TAGS = [
  { id: "p", label: "p" },
  { id: "h1", label: "h1" },
  { id: "h2", label: "h2" },
  { id: "h3", label: "h3" },
  { id: "h4", label: "h4" },
  { id: "h5", label: "h5" },
  { id: "h6", label: "h6" },
  { id: "span", label: "span" },
  { id: "a", label: "a (lien)" },
  { id: "blockquote", label: "blockquote" },
]

function registerSemanticTagChanger(editor: Editor) {
  const defaultType = editor.DomComponents.getType("default")
  const defaultModel = defaultType!.model

  editor.DomComponents.addType("default", {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        resizable: { tl: 1, tr: 1, bl: 1, br: 1, tc: 1, bc: 1, ml: 1, mr: 1 },
        traits: [
          {
            type: "select",
            name: "tagName",
            label: "Balise HTML",
            options: [...SEMANTIC_TAGS, ...TEXT_TAGS],
            changeProp: true,
          },
          ...(defaultModel.prototype.defaults.traits || []),
        ],
      },
    },
  })
}

export function registerAllBlocks(editor: Editor) {
  registerSemanticTagChanger(editor)
  registerSectionBlocks(editor)
  registerBasicBlocks(editor)
  registerEcommerceBlocks(editor)
}
