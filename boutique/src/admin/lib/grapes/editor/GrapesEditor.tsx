import { useCallback } from "react"
import grapesjs, { Editor } from "grapesjs"
import GjsEditor from "@grapesjs/react"
import gjsPresetWebpage from "grapesjs-preset-webpage"
import { registerAllBlocks } from "../blocks"
import { injectFramerTheme } from "../theme"
import { contentSlotPlugin, guardContentPlaceholderDuplicates } from "../plugins/content-slot"
import { blockLockPlugin } from "../plugins/block-lock"
import { contextMenuPlugin } from "../plugins/context-menu"
import { templateSyncPlugin } from "../plugins/template-sync"
import type { GrapesEditorProps } from "../types"

export function GrapesEditor({ onEditor }: GrapesEditorProps) {
  const handleEditor = useCallback(
    (editor: Editor) => {
      injectFramerTheme()
      registerAllBlocks(editor)

      // Register plugins
      contentSlotPlugin(editor)
      guardContentPlaceholderDuplicates(editor)
      blockLockPlugin(editor)
      contextMenuPlugin(editor)
      templateSyncPlugin(editor)

      onEditor(editor)
    },
    [onEditor]
  )

  return (
    <GjsEditor
      grapesjs={grapesjs}
      grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
      plugins={[gjsPresetWebpage]}
      options={{
        height: "100%",
        storageManager: false,
        blockManager: { custom: true },
        canvas: {
          styles: [
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          ],
        },
        deviceManager: {
          devices: [
            { name: "Desktop", width: "" },
            { name: "Tablet", width: "768px", widthMedia: "992px" },
            { name: "Mobile", width: "375px", widthMedia: "480px" },
          ],
        },
      }}
      onEditor={handleEditor}
    />
  )
}
