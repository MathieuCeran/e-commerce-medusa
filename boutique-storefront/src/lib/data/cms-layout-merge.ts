import type { CmsLayout } from "./cms-pages"

const PLACEHOLDER = "<!-- CMS_CONTENT_PLACEHOLDER -->"

/**
 * Merge a CMS layout's HTML with page content HTML.
 * The layout HTML contains a <!-- CMS_CONTENT_PLACEHOLDER --> marker
 * where the page content should be inserted.
 */
export function mergeLayoutWithContent(
  layout: CmsLayout,
  pageHtml: string,
  pageCss: string
): { html: string; css: string } {
  let mergedHtml: string

  if (layout.html.includes(PLACEHOLDER)) {
    mergedHtml = layout.html.replace(PLACEHOLDER, pageHtml)
  } else {
    // Fallback for layouts saved before the placeholder marker was added:
    // append page content after layout HTML
    mergedHtml = layout.html + pageHtml
  }

  // Combine CSS (layout CSS first, then page CSS)
  const mergedCss = [layout.css, pageCss].filter(Boolean).join("\n")

  return { html: mergedHtml, css: mergedCss }
}

/**
 * CSS injected when a CMS layout provides its own header/footer,
 * to hide the default Next.js Nav and Footer from the (main) layout.
 */
export const HIDE_DEFAULT_NAV_FOOTER_CSS = `
  body:has([data-cms-full-layout]) [data-site-nav],
  body:has([data-cms-full-layout]) [data-site-footer] {
    display: none !important;
  }
`
