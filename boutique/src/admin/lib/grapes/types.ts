import type { Editor } from "grapesjs"

export type EditorMode = "page" | "template"

export type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: any
  gjsStyles?: any
}

export type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_og_image_url: string | null
  content: Record<string, any>
  layout_id: string | null
  preview_token: string | null
  updated_at: string
}

export type CmsLayout = {
  id: string
  name: string
  description: string | null
  html: string
  css: string
  component_data: any[]
  content_position: number
  is_default: boolean
}

const EDITOR_ONLY_STYLES = new Set([
  "outline",
  "outline-color",
  "outline-style",
  "outline-width",
  "outline-offset",
])

export function safeGetStyles(editor: Editor): any {
  try {
    return JSON.parse(JSON.stringify(editor.getStyle()))
  } catch {
    return []
  }
}

export function serializeWithStyles(editor: Editor) {
  const wrapper = editor.getWrapper()
  if (!wrapper) return { components: [], styles: [] }
  const components = wrapper.components().map((c: any) => c.toJSON())
  const styles = safeGetStyles(editor)
  return { components, styles }
}

export function filterEditorStyles(styles: any[]): any[] {
  if (!Array.isArray(styles)) return styles
  return styles.map((rule: any) => {
    if (!rule.style) return rule
    const filtered = { ...rule.style }
    for (const key of EDITOR_ONLY_STYLES) delete filtered[key]
    return { ...rule, style: filtered }
  })
}

// --- Component Prop Interfaces ---

export type EditorToolbarProps = {
  editor: Editor | null
  page: CmsPage
  editorMode: EditorMode
  activeDevice: string
  isSaving: boolean
  onSave: () => void
  onPublish: () => void
  onUnpublish: () => void
  onDeviceChange: (device: string) => void
  onFigmaImport: (html: string, css: string) => void
  onNavigateBack: () => void
}

export type EditorSidebarProps = {
  editor: Editor | null
}

export type EditorRightPanelProps = {
  editor: Editor | null
  editorMode: EditorMode
  layouts: CmsLayout[]
  activeLayoutId: string | null
  onLayoutChange: (layoutId: string | null) => void
  onToggleMode: () => void
  onCreateTemplate: (name: string) => void
}

export type GrapesEditorProps = {
  onEditor: (editor: Editor) => void
}
