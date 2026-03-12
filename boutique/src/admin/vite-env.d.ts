/// <reference types="vite/client" />

// Module declarations for packages without type definitions
declare module "@grapesjs/react" {
  import type { Editor, EditorConfig } from "grapesjs"
  import type { ComponentType } from "react"

  interface GjsEditorProps {
    grapesjs: unknown
    grapesjsCss?: string
    plugins?: unknown[]
    options?: Partial<EditorConfig>
    onEditor?: (editor: Editor) => void
    [key: string]: unknown
  }

  const GjsEditor: ComponentType<GjsEditorProps>
  export default GjsEditor
}