"use client"

import { useEffect, useRef, useState } from "react"

export default function StatsCounter(props: Record<string, any>) {
  const innerHTML = props.innerHTML || ""
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  function animateCounters() {
    if (!containerRef.current) return
    const numbers = containerRef.current.querySelectorAll<HTMLElement>("[data-target]")

    numbers.forEach((el) => {
      const target = parseInt(el.getAttribute("data-target") || "0", 10)
      const duration = 2000
      const start = performance.now()

      function tick(now: number) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        el.textContent = Math.round(target * eased).toLocaleString("fr-FR")
        if (progress < 1) requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    })
  }

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true)
          animateCounters()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [hasAnimated])

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: innerHTML }} />
  )
}
