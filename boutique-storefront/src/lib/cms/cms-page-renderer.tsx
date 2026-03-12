import {
  mergeLayoutWithContent,
  HIDE_DEFAULT_NAV_FOOTER_CSS,
} from "@lib/data/cms-layout-merge"
import { extractComponents, hasComponent } from "./hydrate-components"
import { getComponent, type RenderContext } from "./component-registry"
import { registerAllComponents } from "./register-components"

// Ensure components are registered
registerAllComponents()

type CmsPageRendererProps = {
  html: string
  css: string
  layout?: { html: string; css: string } | null
  context: RenderContext
  isPreview?: boolean
}

export async function CmsPageRenderer({
  html,
  css,
  layout,
  context,
  isPreview,
}: CmsPageRendererProps) {
  // 1. Merge layout with page content
  let finalHtml = html
  let finalCss = css

  if (layout) {
    const merged = mergeLayoutWithContent(layout, html, css)
    finalHtml = merged.html
    finalCss = merged.css
  }

  // 2. Smart Nav/Footer detection — only hide defaults if layout provides its own
  const hasCustomHeader = hasComponent(finalHtml, "site-header")
  const hasCustomFooter = hasComponent(finalHtml, "site-footer")
  const hideDefaultNav = hasCustomHeader || hasCustomFooter

  // 3. Extract component segments from HTML
  const segments = extractComponents(finalHtml)

  // 4. Resolve server data for each component segment
  const resolvedSegments = await Promise.all(
    segments.map(async (segment) => {
      if (segment.type === "html") return segment

      const entry = getComponent(segment.name)
      if (!entry) {
        // Unknown component — render as static HTML fallback
        return { type: "html" as const, content: segment.innerHTML }
      }

      let serverData: Record<string, any> = {}
      if (entry.serverDataFn) {
        try {
          serverData = await entry.serverDataFn(segment.attrs, context)
        } catch (err) {
          console.error(
            `[CMS] serverDataFn failed for "${segment.name}":`,
            err
          )
          // Fallback: render raw innerHTML
          return { type: "html" as const, content: segment.innerHTML }
        }
      }

      return {
        type: "resolved-component" as const,
        name: segment.name,
        component: entry.component,
        props: { ...segment.attrs, ...serverData, innerHTML: segment.innerHTML },
      }
    })
  )

  // 5. Render
  return (
    <div data-cms-full-layout={hideDefaultNav ? "true" : undefined}>
      {hideDefaultNav && (
        <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />
      )}
      {finalCss && (
        <style dangerouslySetInnerHTML={{ __html: finalCss }} />
      )}

      {isPreview && (
        <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm font-semibold sticky top-0 z-50">
          PREVIEW MODE — This page is not published yet
        </div>
      )}

      {resolvedSegments.map((segment, i) => {
        if (segment.type === "html") {
          return (
            <div
              key={`html-${i}`}
              dangerouslySetInnerHTML={{ __html: segment.content }}
            />
          )
        }

        if (segment.type === "resolved-component") {
          const Component = segment.component
          return <Component key={`comp-${segment.name}-${i}`} {...segment.props} />
        }

        return null
      })}
    </div>
  )
}
