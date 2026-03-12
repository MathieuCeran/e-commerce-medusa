"use client"

import { useState, useEffect, useRef } from "react"

export default function Tabs(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const buttons = containerRef.current.querySelectorAll<HTMLElement>("[data-tab]")
    const panels = containerRef.current.querySelectorAll<HTMLElement>("[data-tab-panel]")

    const handleClick = (idx: number) => () => setActiveTab(idx)
    const listeners: Array<{ el: HTMLElement; fn: () => void }> = []

    buttons.forEach((btn) => {
      const idx = parseInt(btn.getAttribute("data-tab") || "0", 10)
      const fn = handleClick(idx)
      btn.addEventListener("click", fn)
      listeners.push({ el: btn, fn })
    })

    panels.forEach((panel) => {
      const idx = parseInt(panel.getAttribute("data-tab-panel") || "0", 10)
      panel.style.display = idx === activeTab ? "block" : "none"
    })

    buttons.forEach((btn) => {
      const idx = parseInt(btn.getAttribute("data-tab") || "0", 10)
      btn.style.color = idx === activeTab ? "#111827" : "#6b7280"
      btn.style.borderBottom = idx === activeTab ? "2px solid #111827" : "none"
      btn.style.marginBottom = idx === activeTab ? "-2px" : "0"
    })

    return () => {
      listeners.forEach(({ el, fn }) => el.removeEventListener("click", fn))
    }
  }, [activeTab, innerHTML])

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: innerHTML }} />
  )
}
