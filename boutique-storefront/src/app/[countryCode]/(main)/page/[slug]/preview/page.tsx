import { notFound } from "next/navigation"
import { getCmsPagePreview } from "@lib/data/cms-pages"
import { mergeLayoutWithContent, HIDE_DEFAULT_NAV_FOOTER_CSS } from "@lib/data/cms-layout-merge"
import { GjsRenderer } from "../gjs-renderer"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
  searchParams: Promise<{ token?: string }>
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
}

export default async function CmsPreviewPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const result = await getCmsPagePreview(slug, token)

  if (!result) {
    notFound()
  }

  const { page, layout } = result
  const content = page.content as GjsContent

  if (content?.gjsHtml === undefined && !layout) {
    return (
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    )
  }

  let html = content?.gjsHtml || ""
  let css = content?.gjsCss || ""
  const hasLayout = !!layout

  if (layout) {
    const merged = mergeLayoutWithContent(layout, html, css)
    html = merged.html
    css = merged.css
  }

  return (
    <div {...(hasLayout ? { "data-cms-full-layout": "true" } : {})}>
      {hasLayout && <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />}
      <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm font-semibold sticky top-0 z-50">
        PREVIEW MODE — This page is not published yet
      </div>
      <GjsRenderer html={html} css={css} />
    </div>
  )
}
