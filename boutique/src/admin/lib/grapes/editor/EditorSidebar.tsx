/**
 * Framer-style Insert Panel — custom left sidebar for the GrapeJS editor.
 * Two-panel design: category list (left) → block previews (right).
 */
import { useState, useCallback, useEffect, useRef } from "react"
import type { EditorSidebarProps } from "../types"

// ── Category definitions matching the Framer screenshot ──

type CategoryDef = {
  id: string
  label: string
  group: string
  /** SVG icon rendered at 20×20 inside a 32×32 colored circle */
  icon: string
  /** Background color of the icon circle */
  color: string
  /** Which GrapeJS block category to pull blocks from */
  blockCategory: string
}

const CATEGORIES: CategoryDef[] = [
  // Start
  {
    id: "wireframer",
    label: "Wireframer",
    group: "Start",
    icon: `<path d="M4 4h16v16H4V4z" stroke="currentColor" stroke-width="1.5" fill="none" rx="2"/><path d="M4 9h16M9 9v11" stroke="currentColor" stroke-width="1.5"/>`,
    color: "#0099ff",
    blockCategory: "__all__",
  },
  // Basics
  {
    id: "sections",
    label: "Sections",
    group: "Basics",
    icon: `<rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>`,
    color: "#636e7b",
    blockCategory: "Sections",
  },
  {
    id: "navigation",
    label: "Navigation",
    group: "Basics",
    icon: `<rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 10h4M7 13h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    color: "#0099ff",
    blockCategory: "Navigation",
  },
  // CMS
  {
    id: "collections",
    label: "Collections",
    group: "CMS",
    icon: `<rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 8h8M8 12h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    color: "#0099ff",
    blockCategory: "E-commerce",
  },
  // Elements
  {
    id: "basic",
    label: "Basic",
    group: "Elements",
    icon: `<rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    color: "#34c759",
    blockCategory: "Basic",
  },
  {
    id: "media",
    label: "Media",
    group: "Elements",
    icon: `<rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    color: "#ff3b30",
    blockCategory: "Media",
  },
  {
    id: "forms",
    label: "Forms",
    group: "Elements",
    icon: `<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 10h10M7 14h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    color: "#34c759",
    blockCategory: "Forms",
  },
  {
    id: "interactive",
    label: "Interactive",
    group: "Elements",
    icon: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    color: "#ffcc00",
    blockCategory: "Interactive",
  },
]

const GROUP_ORDER = ["Start", "Basics", "CMS", "Elements"]

// ── Sidebar Component ──

export function EditorSidebar({ editor }: EditorSidebarProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  // Store dragStart/dragStop from the block:custom event (official GrapeJS API)
  const dragStartRef = useRef<((block: any, ev?: Event) => void) | null>(null)
  const dragStopRef = useRef<((block: any) => void) | null>(null)

  // Gather blocks when editor is ready + capture drag callbacks
  useEffect(() => {
    if (!editor) return
    const allBlocks = editor.Blocks.getAll().models || editor.Blocks.getAll()
    setBlocks(Array.isArray(allBlocks) ? allBlocks : [...allBlocks])

    const onBlockCustom = (props: any) => {
      dragStartRef.current = props.dragStart
      dragStopRef.current = props.dragStop
      // Also update blocks list from the event
      if (props.blocks?.length) setBlocks([...props.blocks])
    }
    editor.on("block:custom", onBlockCustom)
    return () => { editor.off("block:custom", onBlockCustom) }
  }, [editor])

  const getBlocksForCategory = useCallback(
    (cat: CategoryDef) => {
      if (!blocks.length) return []
      if (cat.blockCategory === "__all__") return blocks
      return blocks.filter((b: any) => {
        const c = b.get?.("category") || b.category
        const catLabel = typeof c === "string" ? c : c?.label || c?.id || ""
        return catLabel === cat.blockCategory
      })
    },
    [blocks]
  )

  const filteredCategories = search.trim()
    ? CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          getBlocksForCategory(c).some((b: any) =>
            (b.get?.("label") || b.label || "")
              .toLowerCase()
              .includes(search.toLowerCase())
          )
      )
    : CATEGORIES

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: filteredCategories.filter((c) => c.group === g),
  })).filter((g) => g.items.length > 0)

  // Unified mousedown handler: drag-to-place (via block:custom dragStart) or click-to-add
  const isDraggingRef = useRef(false)

  const handleBlockMouseDown = useCallback(
    (block: any, e: React.MouseEvent) => {
      if (!editor) return
      e.preventDefault()
      isDraggingRef.current = false

      const content = block.get?.("content") || block.content
      if (!content) return

      const startX = e.clientX
      const startY = e.clientY

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (isDraggingRef.current) return
        const dx = moveEvt.clientX - startX
        const dy = moveEvt.clientY - startY
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isDraggingRef.current = true
          // Clean up our listeners — GrapeJS sorter takes over from here
          document.removeEventListener("mousemove", onMouseMove)
          document.removeEventListener("mouseup", onMouseUp)
          if (dragStartRef.current) {
            dragStartRef.current(block, moveEvt)
          }
        }
      }

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        if (!isDraggingRef.current) {
          // Click (no drag movement) — append block to canvas
          editor.addComponents(content)
        }
        setTimeout(() => { isDraggingRef.current = false }, 0)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [editor]
  )

  const activeCategoryDef = CATEGORIES.find((c) => c.id === activeCategory)
  const activeCategoryBlocks = activeCategoryDef
    ? getBlocksForCategory(activeCategoryDef)
    : []

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        background: "#fff",
        borderRight: "1px solid #e8e8e8",
        userSelect: "none",
        position: "relative",
        zIndex: 5,
      }}
    >
      {/* ── Left: Category List ── */}
      <div
        style={{
          width: 220,
          height: "100%",
          overflowY: "auto",
          borderRight: activeCategory ? "1px solid #f0f0f0" : "none",
        }}
      >
        {/* Search */}
        <div style={{ padding: "12px 14px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              background: "#f7f7f7",
              borderRadius: 8,
              border: "1px solid #ebebeb",
              transition: "border-color 0.15s",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aaa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                color: "#333",
                fontSize: 13,
                fontFamily: "inherit",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Category Groups */}
        {grouped.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 4 }}>
            {/* Group label */}
            <div
              style={{
                padding: "12px 16px 6px",
                fontSize: 11,
                fontWeight: 600,
                color: "#999",
                letterSpacing: "0.02em",
              }}
            >
              {group}
            </div>

            {/* Category items */}
            {items.map((cat) => {
              const isActive = activeCategory === cat.id
              const catBlocks = getBlocksForCategory(cat)
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setActiveCategory(isActive ? null : cat.id)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 10,
                    padding: "8px 16px",
                    border: "none",
                    background: isActive ? "#f0f0f0" : "transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "background 0.12s",
                    fontFamily: "inherit",
                    marginBottom: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "#f7f7f7"
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent"
                  }}
                >
                  {/* Colored icon circle */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: cat.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: cat.icon }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      flex: 1,
                      textAlign: "left",
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive ? "#1a1a1a" : "#444",
                    }}
                  >
                    {cat.label}
                  </span>

                  {/* Count + Chevron */}
                  {catBlocks.length > 0 && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ccc"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isActive
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Right: Block Previews (when a category is open) ── */}
      {activeCategory && (
        <div
          style={{
            width: 260,
            height: "100%",
            overflowY: "auto",
            background: "#fafafa",
            animation: "fadeIn 0.15s ease",
          }}
        >
          {/* Category header */}
          <div
            style={{
              padding: "14px 16px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1a1a1a",
              }}
            >
              {activeCategoryDef?.label}
            </span>
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#bbb",
                padding: 4,
                borderRadius: 4,
                display: "flex",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#666"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#bbb"
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Block grid */}
          <div
            style={{
              padding: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {activeCategoryBlocks.map((block: any, idx: number) => {
              const label =
                block.get?.("label") || block.label || "Block"
              const media =
                block.get?.("media") || block.media || ""
              return (
                <div
                  key={block.get?.("id") || block.id || idx}
                  onMouseDown={(e) => handleBlockMouseDown(block, e)}
                  style={{
                    background: "#fff",
                    border: "1px solid #ebebeb",
                    borderRadius: 10,
                    padding: "16px 10px 12px",
                    cursor: "grab",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ddd"
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.04)"
                    e.currentTarget.style.transform =
                      "translateY(-1px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#ebebeb"
                    e.currentTarget.style.boxShadow = "none"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  {/* Block icon */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: media || "",
                    }}
                  />
                  {/* Block label */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#666",
                      textAlign: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            })}

            {activeCategoryBlocks.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#bbb",
                  fontSize: 12,
                }}
              >
                No blocks in this category
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
