"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export default function TestimonialsCarousel(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const autoplay = props["data-autoplay"] === "true"
  const interval = parseInt(props["data-interval"] || "5000", 10)

  const containerRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const [slideCount, setSlideCount] = useState(0)

  const goTo = useCallback(
    (index: number) => {
      if (!containerRef.current) return
      const slides = containerRef.current.querySelectorAll<HTMLElement>(".testimonial-slide")
      const dots = containerRef.current.querySelectorAll<HTMLElement>("[data-dot]")

      slides.forEach((s, i) => (s.style.display = i === index ? "block" : "none"))
      dots.forEach((d, i) => {
        d.style.background = i === index ? "#111827" : "#d1d5db"
      })

      setCurrent(index)
    },
    []
  )

  useEffect(() => {
    if (!containerRef.current) return
    const slides = containerRef.current.querySelectorAll(".testimonial-slide")
    setSlideCount(slides.length)

    // Find dot elements (inline spans with border-radius) and add data-dot + click handlers
    const dotsContainer = containerRef.current.querySelector("div[style*='justify-content']")
    if (dotsContainer) {
      const dotSpans = dotsContainer.querySelectorAll<HTMLElement>("span")
      dotSpans.forEach((dot, i) => {
        dot.setAttribute("data-dot", String(i))
        dot.style.cursor = "pointer"
        dot.addEventListener("click", () => goTo(i))
      })
    }

    goTo(0)
  }, [innerHTML, goTo])

  useEffect(() => {
    if (!autoplay || slideCount < 2) return

    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % slideCount
        goTo(next)
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [autoplay, interval, slideCount, goTo])

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: innerHTML }} />
  )
}
