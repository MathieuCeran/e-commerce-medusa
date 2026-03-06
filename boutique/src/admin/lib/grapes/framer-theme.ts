/**
 * GrapeJS Framer-Style Dark Theme
 * Injected via useEffect in the editor component.
 */

const FRAMER_THEME_CSS = `
/* === Root Variables === */
.gjs-one-bg { background-color: #0a0a0a !important; }
.gjs-two-color { color: #999 !important; }
.gjs-three-bg { background-color: #111 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #fff !important; }

/* === Global Editor Shell === */
.gjs-editor {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif !important;
  background: #0a0a0a !important;
  border: none !important;
}

/* === Panels === */
.gjs-pn-panel {
  background: #0a0a0a !important;
  border-color: #1a1a1a !important;
}
.gjs-pn-views,
.gjs-pn-views-container {
  background: #0a0a0a !important;
  border-left: 1px solid #1a1a1a !important;
}
.gjs-pn-options {
  background: #0a0a0a !important;
  border-bottom: 1px solid #1a1a1a !important;
}
.gjs-pn-commands {
  background: #0a0a0a !important;
  border-bottom: 1px solid #1a1a1a !important;
}
.gjs-pn-devices-c {
  background: #0a0a0a !important;
}

/* === Panel Buttons === */
.gjs-pn-btn {
  color: #666 !important;
  border-radius: 6px !important;
  padding: 5px 6px !important;
  margin: 2px !important;
  transition: all 0.15s ease !important;
  border: none !important;
}
.gjs-pn-btn:hover {
  color: #fff !important;
  background: #1a1a1a !important;
}
.gjs-pn-btn.gjs-pn-active {
  color: #fff !important;
  background: #0099ff !important;
  box-shadow: 0 0 0 1px rgba(0, 153, 255, 0.3) !important;
}

/* === Right Panel === */
.gjs-pn-views-container {
  width: 260px !important;
  scrollbar-width: thin;
  scrollbar-color: #333 transparent;
}

/* === Blocks === */
.gjs-blocks-cs { background: #0a0a0a !important; }
.gjs-block-categories { background: #0a0a0a !important; }
.gjs-block-category {
  background: transparent !important;
  border-bottom: 1px solid #1a1a1a !important;
}
.gjs-block-category .gjs-title {
  background: transparent !important;
  color: #888 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  padding: 10px 12px !important;
  border: none !important;
  transition: color 0.15s ease !important;
}
.gjs-block-category .gjs-title:hover { color: #ccc !important; }
.gjs-block-category .gjs-caret-icon { color: #555 !important; }

.gjs-block {
  background: #141414 !important;
  border: 1px solid #1e1e1e !important;
  border-radius: 8px !important;
  color: #888 !important;
  padding: 12px 8px !important;
  margin: 3px !important;
  min-height: 68px !important;
  transition: all 0.2s ease !important;
  cursor: grab !important;
}
.gjs-block:hover {
  background: #1a1a1a !important;
  border-color: #333 !important;
  color: #ddd !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}
.gjs-block svg {
  fill: currentColor !important;
  color: #666 !important;
  transition: color 0.15s ease !important;
}
.gjs-block:hover svg { color: #0099ff !important; }
.gjs-block-label {
  font-size: 11px !important;
  font-weight: 500 !important;
  color: inherit !important;
  margin-top: 6px !important;
}

/* === Canvas === */
.gjs-cv-canvas { background: #0a0a0a !important; top: 0 !important; }
.gjs-frame-wrapper { background: #0a0a0a !important; }

/* === Layers === */
.gjs-layer {
  background: transparent !important;
  border-bottom: 1px solid #141414 !important;
  font-size: 12px !important;
}
.gjs-layer:hover { background: #111 !important; }
.gjs-layer.gjs-selected { background: rgba(0, 153, 255, 0.08) !important; }
.gjs-layer-title { background: transparent !important; border: none !important; padding: 7px 10px !important; }
.gjs-layer-name { color: #999 !important; font-size: 12px !important; }
.gjs-layer.gjs-selected .gjs-layer-name { color: #0099ff !important; }
.gjs-layers { background: #0a0a0a !important; }

/* === Style Manager === */
.gjs-sm-sector {
  background: transparent !important;
  border-bottom: 1px solid #1a1a1a !important;
}
.gjs-sm-sector-title {
  background: transparent !important;
  color: #888 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  padding: 10px 12px !important;
  border: none !important;
  transition: color 0.15s ease !important;
}
.gjs-sm-sector-title:hover { color: #ccc !important; }
.gjs-sm-sector-caret { color: #555 !important; }
.gjs-sm-properties { padding: 8px 12px !important; }
.gjs-sm-property { margin-bottom: 6px !important; }
.gjs-sm-label { color: #666 !important; font-size: 11px !important; font-weight: 500 !important; }

/* === Inputs & Fields === */
.gjs-field {
  background: #141414 !important;
  border: 1px solid #1e1e1e !important;
  border-radius: 6px !important;
  color: #ddd !important;
  transition: border-color 0.15s ease !important;
}
.gjs-field:hover { border-color: #333 !important; }
.gjs-field:focus-within {
  border-color: #0099ff !important;
  box-shadow: 0 0 0 2px rgba(0, 153, 255, 0.1) !important;
}
.gjs-field input,
.gjs-field select,
.gjs-field textarea {
  color: #ddd !important;
  background: transparent !important;
  font-family: inherit !important;
  font-size: 12px !important;
}
.gjs-field input::placeholder { color: #444 !important; }
.gjs-field-arrow-u, .gjs-field-arrow-d { border-color: transparent transparent #555 !important; }
.gjs-field-arrow-d { border-color: #555 transparent transparent !important; }
.gjs-input-holder input { color: #ddd !important; }

/* === Select === */
.gjs-field-select .gjs-d-s-arrow { color: #555 !important; }
.gjs-field select { background: #141414 !important; border: none !important; color: #ddd !important; }

/* === Radio === */
.gjs-radio-item {
  background: #141414 !important;
  border: 1px solid #1e1e1e !important;
  color: #888 !important;
  transition: all 0.15s ease !important;
}
.gjs-radio-item:hover { background: #1a1a1a !important; color: #ccc !important; }
.gjs-radio-item input:checked + .gjs-radio-item-label { background: #0099ff !important; color: #fff !important; }
.gjs-radio-item-label { border-radius: 4px !important; }

/* === Color picker === */
.gjs-field-color .gjs-checker-bg, .gjs-field-color .gjs-field-colorp { border-radius: 4px !important; }
.sp-container { background: #111 !important; border: 1px solid #2a2a2a !important; border-radius: 8px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important; }
.sp-input { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 4px !important; color: #ddd !important; }

/* === Traits === */
.gjs-trt-trait { border-bottom: 1px solid #141414 !important; padding: 6px 0 !important; }
.gjs-trt-trait .gjs-label { color: #666 !important; font-size: 11px !important; font-weight: 500 !important; }
.gjs-trt-traits { padding: 8px 12px !important; }

/* === Component Toolbar === */
.gjs-toolbar {
  background: #111 !important;
  border: 1px solid #2a2a2a !important;
  border-radius: 8px !important;
  padding: 2px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
}
.gjs-toolbar-item {
  color: #888 !important;
  padding: 5px 7px !important;
  border-radius: 5px !important;
  transition: all 0.15s ease !important;
}
.gjs-toolbar-item:hover { color: #fff !important; background: rgba(255,255,255,0.08) !important; }

/* === Selection === */
.gjs-selected { outline: 2px solid #0099ff !important; outline-offset: -2px; }
.gjs-hovered { outline: 1px dashed rgba(0, 153, 255, 0.5) !important; }

/* === Resizer === */
.gjs-resizer-h { border: 2px solid #0099ff !important; border-radius: 50% !important; width: 10px !important; height: 10px !important; background: #0a0a0a !important; }

/* === Badge === */
.gjs-badge { background: #0099ff !important; color: #fff !important; font-size: 10px !important; font-weight: 500 !important; padding: 2px 6px !important; border-radius: 4px !important; letter-spacing: 0.02em !important; }

/* === Placeholder === */
.gjs-placeholder { border-color: #0099ff !important; border-width: 2px !important; }

/* === RTE === */
.gjs-rte-toolbar { background: #111 !important; border: 1px solid #2a2a2a !important; border-radius: 8px !important; padding: 3px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important; }
.gjs-rte-actionbar .gjs-rte-action { color: #888 !important; border-right: 1px solid #1e1e1e !important; transition: color 0.15s ease !important; }
.gjs-rte-actionbar .gjs-rte-action:hover { color: #fff !important; }
.gjs-rte-actionbar .gjs-rte-active { color: #0099ff !important; }

/* === Modal === */
.gjs-mdl-dialog { background: #111 !important; border: 1px solid #2a2a2a !important; border-radius: 12px !important; box-shadow: 0 24px 48px rgba(0,0,0,0.5) !important; color: #ddd !important; }
.gjs-mdl-header { border-bottom: 1px solid #1e1e1e !important; color: #fff !important; }
.gjs-mdl-title { font-weight: 600 !important; }
.gjs-mdl-btn-close { color: #666 !important; transition: color 0.15s ease !important; }
.gjs-mdl-btn-close:hover { color: #fff !important; }
.gjs-mdl-content { background: transparent !important; }

/* === Asset Manager === */
.gjs-am-assets-header { background: transparent !important; border-bottom: 1px solid #1e1e1e !important; padding: 12px !important; }
.gjs-am-add-asset .gjs-am-add-field { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 6px !important; color: #ddd !important; }
.gjs-am-assets-cont { background: transparent !important; }
.gjs-am-asset-image .gjs-am-preview-cont { border-radius: 6px !important; overflow: hidden !important; }

/* === Devices === */
.gjs-devices-c select { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 6px !important; color: #ddd !important; padding: 4px 8px !important; font-size: 12px !important; }

/* === Scrollbars === */
.gjs-pn-views-container::-webkit-scrollbar, .gjs-blocks-cs::-webkit-scrollbar, .gjs-layers::-webkit-scrollbar { width: 4px; }
.gjs-pn-views-container::-webkit-scrollbar-track, .gjs-blocks-cs::-webkit-scrollbar-track, .gjs-layers::-webkit-scrollbar-track { background: transparent; }
.gjs-pn-views-container::-webkit-scrollbar-thumb, .gjs-blocks-cs::-webkit-scrollbar-thumb, .gjs-layers::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
.gjs-pn-views-container::-webkit-scrollbar-thumb:hover, .gjs-blocks-cs::-webkit-scrollbar-thumb:hover, .gjs-layers::-webkit-scrollbar-thumb:hover { background: #444; }

/* === Layer caret === */
.gjs-layer-caret { color: #444 !important; transition: color 0.15s ease !important; }
.gjs-layer-caret:hover { color: #888 !important; }

/* === Context menu === */
.gjs-cm-editor { background: #111 !important; border: 1px solid #2a2a2a !important; border-radius: 8px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; overflow: hidden !important; }

/* === Selector Manager === */
.gjs-clm-tags { background: transparent !important; padding: 8px 12px !important; }
.gjs-clm-tag { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 4px !important; color: #999 !important; font-size: 11px !important; }
.gjs-clm-sels-info { color: #555 !important; font-size: 11px !important; }
#gjs-clm-new { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 6px !important; color: #ddd !important; }
#gjs-clm-close { color: #555 !important; }

/* === Transitions === */
.gjs-block-category .gjs-blocks, .gjs-sm-sector .gjs-sm-properties { transition: max-height 0.25s ease !important; }

/* === Shared Keyframes === */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
@keyframes figmaModalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
`

const STYLE_ID = "gjs-framer-theme"

export function injectFramerTheme() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = FRAMER_THEME_CSS
  document.head.appendChild(style)
}

export function removeFramerTheme() {
  const el = document.getElementById(STYLE_ID)
  if (el) el.remove()
}
