"use client"

import { useState } from "react"

function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

function getThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`
  return null
}

export default function VideoEmbed(props: Record<string, string>) {
  const url = props["data-url"] || ""
  const autoplay = props["data-autoplay"] === "true"
  const [playing, setPlaying] = useState(autoplay)

  const embedUrl = getEmbedUrl(url)
  const thumbnail = getThumbnail(url)

  if (!embedUrl) {
    return (
      <div style={{ position: "relative", paddingTop: "56.25%", background: "#0f172a", borderRadius: 8 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
          Video non configuree
        </div>
      </div>
    )
  }

  if (!playing && thumbnail) {
    return (
      <div
        onClick={() => setPlaying(true)}
        style={{ position: "relative", paddingTop: "56.25%", borderRadius: 8, overflow: "hidden", cursor: "pointer" }}
      >
        <img src={thumbnail} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="white"><polygon points="10,8 16,12 10,16" /></svg>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 8, overflow: "hidden" }}>
      <iframe
        src={`${embedUrl}${autoplay ? "?autoplay=1" : ""}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
