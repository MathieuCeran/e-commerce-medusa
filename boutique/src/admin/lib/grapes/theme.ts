/**
 * GrapeJS Framer-Style Light Theme
 * Matches the Framer insert panel aesthetic: white bg, clean lines, subtle shadows.
 */

const FRAMER_THEME_CSS = `
/* === Root Variables === */
.gjs-one-bg { background-color: #ffffff !important; }
.gjs-two-color { color: #999 !important; }
.gjs-three-bg { background-color: #f7f7f7 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #1a1a1a !important; }

/* === Global Editor Shell === */
.gjs-editor {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif !important;
  background: #f0f0f0 !important;
  border: none !important;
}

/* === Right panel: Style Manager / Traits / Layers === */
/* Hide the default GrapeJS view tab bar — we use our own tab switcher */
.gjs-pn-views {
  display: none !important;
}
.gjs-pn-views-container {
  background: #ffffff !important;
  border-left: 1px solid #e8e8e8 !important;
  width: 280px !important;
  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
  top: 0 !important;
}

/* === Panels === */
.gjs-pn-panel {
  background: #ffffff !important;
  border-color: #e8e8e8 !important;
}
.gjs-pn-options {
  background: #ffffff !important;
  border-bottom: 1px solid #e8e8e8 !important;
}
.gjs-pn-commands {
  background: #ffffff !important;
  border-bottom: 1px solid #e8e8e8 !important;
}
.gjs-pn-devices-c {
  background: #ffffff !important;
}

/* === Panel Buttons === */
.gjs-pn-btn {
  color: #999 !important;
  border-radius: 6px !important;
  padding: 5px 6px !important;
  margin: 2px !important;
  transition: all 0.15s ease !important;
  border: none !important;
}
.gjs-pn-btn:hover {
  color: #333 !important;
  background: #f0f0f0 !important;
}
.gjs-pn-btn.gjs-pn-active {
  color: #fff !important;
  background: #0099ff !important;
  box-shadow: 0 0 0 1px rgba(0, 153, 255, 0.2) !important;
}

/* === Blocks (in second panel) === */
.gjs-blocks-cs { background: #ffffff !important; }
.gjs-block-categories { background: #ffffff !important; }
.gjs-block-category {
  background: transparent !important;
  border-bottom: 1px solid #f0f0f0 !important;
}
.gjs-block-category .gjs-title {
  background: transparent !important;
  color: #999 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  padding: 10px 12px !important;
  border: none !important;
  transition: color 0.15s ease !important;
}
.gjs-block-category .gjs-title:hover { color: #333 !important; }
.gjs-block-category .gjs-caret-icon { color: #bbb !important; }

.gjs-block {
  background: #f9f9f9 !important;
  border: 1px solid #ebebeb !important;
  border-radius: 10px !important;
  color: #666 !important;
  padding: 14px 10px !important;
  margin: 4px !important;
  min-height: 72px !important;
  transition: all 0.2s ease !important;
  cursor: grab !important;
}
.gjs-block:hover {
  background: #f0f0f0 !important;
  border-color: #ddd !important;
  color: #333 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
}
.gjs-block svg {
  fill: currentColor !important;
  color: #999 !important;
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
.gjs-cv-canvas {
  background: #f0f0f0 !important;
  top: 0 !important;
  width: 100% !important;
  left: 0 !important;
}
.gjs-frame-wrapper {
  background: #f0f0f0 !important;
  margin: 0 !important;
  padding: 0 !important;
}
/* Remove default canvas frame margin/padding */
.gjs-frame-wrapper__top,
.gjs-frame-wrapper__left,
.gjs-frame-wrapper__right,
.gjs-frame-wrapper__bottom {
  display: none !important;
}
.gjs-frame {
  margin: 0 auto !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
}

/* === Hide default GrapeJS top panels (we use our own toolbar) === */
.gjs-pn-commands,
.gjs-pn-devices-c,
.gjs-pn-options {
  display: none !important;
}

/* === Layers === */
.gjs-layer {
  background: transparent !important;
  border-bottom: 1px solid #f0f0f0 !important;
  font-size: 12px !important;
}
.gjs-layer:hover { background: #f7f7f7 !important; }
.gjs-layer.gjs-selected { background: rgba(0, 153, 255, 0.06) !important; }
.gjs-layer-title { background: transparent !important; border: none !important; padding: 7px 10px !important; }
.gjs-layer-name { color: #666 !important; font-size: 12px !important; }
.gjs-layer.gjs-selected .gjs-layer-name { color: #0099ff !important; }
.gjs-layers { background: #ffffff !important; }

/* === Style Manager === */
.gjs-sm-sector {
  background: transparent !important;
  border-bottom: 1px solid #f0f0f0 !important;
}
.gjs-sm-sector-title {
  background: transparent !important;
  color: #999 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  padding: 10px 12px !important;
  border: none !important;
  transition: color 0.15s ease !important;
}
.gjs-sm-sector-title:hover { color: #333 !important; }
.gjs-sm-sector-caret { color: #bbb !important; }
.gjs-sm-properties { padding: 8px 12px !important; }
.gjs-sm-property { margin-bottom: 6px !important; }
.gjs-sm-label { color: #999 !important; font-size: 11px !important; font-weight: 500 !important; }

/* === Inputs & Fields === */
.gjs-field {
  background: #f7f7f7 !important;
  border: 1px solid #e8e8e8 !important;
  border-radius: 8px !important;
  color: #333 !important;
  transition: border-color 0.15s ease !important;
}
.gjs-field:hover { border-color: #ccc !important; }
.gjs-field:focus-within {
  border-color: #0099ff !important;
  box-shadow: 0 0 0 2px rgba(0, 153, 255, 0.08) !important;
}
.gjs-field input,
.gjs-field select,
.gjs-field textarea {
  color: #333 !important;
  background: transparent !important;
  font-family: inherit !important;
  font-size: 12px !important;
}
.gjs-field input::placeholder { color: #bbb !important; }
.gjs-field-arrow-u, .gjs-field-arrow-d { border-color: transparent transparent #bbb !important; }
.gjs-field-arrow-d { border-color: #bbb transparent transparent !important; }
.gjs-input-holder input { color: #333 !important; }

/* === Select === */
.gjs-field-select .gjs-d-s-arrow { color: #bbb !important; }
.gjs-field select { background: #f7f7f7 !important; border: none !important; color: #333 !important; }

/* === Radio === */
.gjs-radio-item {
  background: #f7f7f7 !important;
  border: 1px solid #e8e8e8 !important;
  color: #999 !important;
  transition: all 0.15s ease !important;
}
.gjs-radio-item:hover { background: #f0f0f0 !important; color: #333 !important; }
.gjs-radio-item input:checked + .gjs-radio-item-label { background: #0099ff !important; color: #fff !important; }
.gjs-radio-item-label { border-radius: 4px !important; }

/* === Color picker === */
.gjs-field-color .gjs-checker-bg, .gjs-field-color .gjs-field-colorp { border-radius: 6px !important; }
.sp-container { background: #fff !important; border: 1px solid #e8e8e8 !important; border-radius: 10px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
.sp-input { background: #f7f7f7 !important; border: 1px solid #e8e8e8 !important; border-radius: 6px !important; color: #333 !important; }

/* === Traits === */
.gjs-trt-trait { border-bottom: 1px solid #f0f0f0 !important; padding: 6px 0 !important; }
.gjs-trt-trait .gjs-label { color: #999 !important; font-size: 11px !important; font-weight: 500 !important; }
.gjs-trt-traits { padding: 8px 12px !important; }

/* === Component Toolbar === */
.gjs-toolbar {
  background: #fff !important;
  border: 1px solid #e8e8e8 !important;
  border-radius: 8px !important;
  padding: 2px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
}
.gjs-toolbar-item {
  color: #999 !important;
  padding: 5px 7px !important;
  border-radius: 5px !important;
  transition: all 0.15s ease !important;
}
.gjs-toolbar-item:hover { color: #333 !important; background: #f0f0f0 !important; }

/* === Selection === */
.gjs-selected { outline: 2px solid #0099ff !important; outline-offset: -2px; }
.gjs-hovered { outline: 1px dashed rgba(0, 153, 255, 0.4) !important; }

/* === Resizer === */
.gjs-resizer-h { border: 2px solid #0099ff !important; border-radius: 50% !important; width: 10px !important; height: 10px !important; background: #fff !important; }

/* === Badge === */
.gjs-badge { background: #0099ff !important; color: #fff !important; font-size: 10px !important; font-weight: 500 !important; padding: 2px 6px !important; border-radius: 4px !important; letter-spacing: 0.02em !important; }

/* === Placeholder === */
.gjs-placeholder { border-color: #0099ff !important; border-width: 2px !important; }

/* === RTE === */
.gjs-rte-toolbar { background: #fff !important; border: 1px solid #e8e8e8 !important; border-radius: 8px !important; padding: 3px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; }
.gjs-rte-actionbar .gjs-rte-action { color: #999 !important; border-right: 1px solid #f0f0f0 !important; transition: color 0.15s ease !important; }
.gjs-rte-actionbar .gjs-rte-action:hover { color: #333 !important; }
.gjs-rte-actionbar .gjs-rte-active { color: #0099ff !important; }

/* === Modal === */
.gjs-mdl-dialog { background: #fff !important; border: 1px solid #e8e8e8 !important; border-radius: 14px !important; box-shadow: 0 24px 48px rgba(0,0,0,0.1) !important; color: #333 !important; }
.gjs-mdl-header { border-bottom: 1px solid #f0f0f0 !important; color: #1a1a1a !important; }
.gjs-mdl-title { font-weight: 600 !important; }
.gjs-mdl-btn-close { color: #bbb !important; transition: color 0.15s ease !important; }
.gjs-mdl-btn-close:hover { color: #333 !important; }
.gjs-mdl-content { background: transparent !important; }

/* === Asset Manager === */
.gjs-am-assets-header { background: transparent !important; border-bottom: 1px solid #f0f0f0 !important; padding: 12px !important; }
.gjs-am-add-asset .gjs-am-add-field { background: #f7f7f7 !important; border: 1px solid #e8e8e8 !important; border-radius: 8px !important; color: #333 !important; }
.gjs-am-assets-cont { background: transparent !important; }
.gjs-am-asset-image .gjs-am-preview-cont { border-radius: 8px !important; overflow: hidden !important; }

/* === Devices === */
.gjs-devices-c select { background: #f7f7f7 !important; border: 1px solid #e8e8e8 !important; border-radius: 8px !important; color: #333 !important; padding: 4px 8px !important; font-size: 12px !important; }

/* === Scrollbars === */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #ccc; }

/* === Layer caret === */
.gjs-layer-caret { color: #ccc !important; transition: color 0.15s ease !important; }
.gjs-layer-caret:hover { color: #666 !important; }

/* === Context menu === */
.gjs-cm-editor { background: #fff !important; border: 1px solid #e8e8e8 !important; border-radius: 10px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; overflow: hidden !important; }

/* === Selector Manager === */
.gjs-clm-tags { background: transparent !important; padding: 8px 12px !important; }
.gjs-clm-tag { background: #f7f7f7 !important; border: 1px solid #e8e8e8 !important; border-radius: 6px !important; color: #666 !important; font-size: 11px !important; }
.gjs-clm-sels-info { color: #bbb !important; font-size: 11px !important; }
#gjs-clm-new { background: #f7f7f7 !important; border: 1px solid #e8e8e8 !important; border-radius: 8px !important; color: #333 !important; }
#gjs-clm-close { color: #bbb !important; }

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
