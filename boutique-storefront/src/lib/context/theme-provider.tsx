"use client"

import { ThemeSettings } from "@lib/data/cms-pages"

type ThemeProviderProps = {
  settings: ThemeSettings | null
  children: React.ReactNode
}

export function ThemeProvider({ settings, children }: ThemeProviderProps) {
  if (!settings) {
    return <>{children}</>
  }

  const cssVars = {
    "--theme-primary": settings.primary_color,
    "--theme-secondary": settings.secondary_color,
    "--theme-accent": settings.accent_color,
    "--theme-background": settings.background_color,
    "--theme-text": settings.text_color,
    "--theme-text-muted": settings.text_muted_color,
    "--theme-font-heading": settings.heading_font,
    "--theme-font-body": settings.body_font,
    "--theme-header-bg": settings.header_bg_color,
    "--theme-header-text": settings.header_text_color,
    "--theme-footer-bg": settings.footer_bg_color,
    "--theme-footer-text": settings.footer_text_color,
    "--theme-button-bg": settings.button_bg_color,
    "--theme-button-text": settings.button_text_color,
    "--theme-button-radius": settings.button_border_radius,
  } as React.CSSProperties

  return (
    <div style={cssVars} className="theme-root">
      {children}
    </div>
  )
}

// CSS utility classes that use theme variables
// Add to globals.css:
// .theme-root { font-family: var(--theme-font-body, inherit); }
// .theme-heading { font-family: var(--theme-font-heading, inherit); color: var(--theme-heading); }
// .theme-text { color: var(--theme-text); }
// .theme-bg { background-color: var(--theme-background); }
// .theme-link { color: var(--theme-link); }
// .theme-button { background-color: var(--theme-button-bg); color: var(--theme-button-text); }
