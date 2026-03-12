import {
  mergeLayoutWithContent,
  HIDE_DEFAULT_NAV_FOOTER_CSS,
} from "@lib/data/cms-layout-merge"
import { extractComponents, hasComponent } from "./hydrate-components"
import { getComponent, type RenderContext } from "./component-registry"
import { registerAllComponents } from "./register-components"
import { sanitizeCmsHtml, stripGjsArtifacts, scopeCmsCss } from "./sanitize"

// Ensure components are registered
registerAllComponents()

type CmsLayout = {
  id: string
  html: string
  css: string
  content_position: number
}

type CmsPageRendererProps = {
  html: string
  css: string
  layout?: CmsLayout | null
  context: RenderContext
  isPreview?: boolean
  slug: string
}

export async function CmsPageRenderer({
  html,
  css,
  layout,
  context,
  isPreview,
  slug,
}: CmsPageRendererProps) {
  // 1. Merge layout with page content
  let finalHtml = html
  let finalCss = css

  if (layout) {
    const merged = mergeLayoutWithContent(layout, html, css)
    finalHtml = merged.html
    finalCss = merged.css
  }

  // 2. Sanitize + strip GrapesJS artifacts + scope CSS
  finalHtml = sanitizeCmsHtml(finalHtml)
  finalHtml = stripGjsArtifacts(finalHtml)
  finalCss = scopeCmsCss(finalCss, slug)

  // 3. Hide default Nav/Footer when the CMS page provides its own
  //    (via a layout template or explicit site-header/site-footer blocks)
  const hideDefaultNav =
    !!layout ||
    hasComponent(finalHtml, "site-header") ||
    hasComponent(finalHtml, "site-footer")

  // 4. Extract component segments from HTML
  const segments = extractComponents(finalHtml)

  // 5. Resolve server data for each component segment
  const resolvedSegments = await Promise.all(
    segments.map(async (segment) => {
      if (segment.type === "html") return segment

      const entry = getComponent(segment.name)
      if (!entry) {
        // Unregistered component — render the full GrapesJS element as-is
        return { type: "html" as const, content: segment.outerHTML }
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

  // 6. Render
  return (
    <div data-cms-page={slug} data-cms-full-layout={hideDefaultNav ? "true" : undefined}>
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
