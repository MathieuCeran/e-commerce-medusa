"use client"

import { useState, useEffect } from "react"

export default function AnnouncementBar(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const dismissible = props["data-dismissible"] === "true"
  const bannerId = props["data-id"] || "default"
  const storageKey = `cms-announcement-${bannerId}`

  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissible && typeof window !== "undefined") {
      setDismissed(localStorage.getItem(storageKey) === "dismissed")
    }
  }, [dismissible, storageKey])

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "dismissed")
    setDismissed(true)
  }

  return (
    <div style={{ position: "relative" }}>
      <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
      {dismissible && (
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            opacity: 0.7,
          }}
          aria-label="Fermer"
        >
          &times;
        </button>
      )}
    </div>
  )
}
