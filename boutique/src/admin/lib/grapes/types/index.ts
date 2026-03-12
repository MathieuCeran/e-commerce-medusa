import type { Editor } from "grapesjs"
import { registerStaticTypes } from "./static"
import { registerMediaTypes } from "./media"
import { registerNavigationTypes } from "./navigation"
import { registerInteractiveTypes } from "./interactive"
import { registerEcommerceTypes } from "./ecommerce"

export function registerAllTypes(editor: Editor) {
  registerStaticTypes(editor)
  registerMediaTypes(editor)
  registerNavigationTypes(editor)
  registerInteractiveTypes(editor)
  registerEcommerceTypes(editor)
}
