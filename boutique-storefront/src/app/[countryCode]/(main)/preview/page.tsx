import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPagePreview } from "@lib/data/cms-pages"
import { mergeLayoutWithContent, HIDE_DEFAULT_NAV_FOOTER_CSS } from "@lib/data/cms-layout-merge"
import { GjsRenderer } from "../page/[slug]/gjs-renderer"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ token?: string }>
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { token } = await searchParams

  if (!token) return {}

  const result = await getCmsPagePreview("/", token)
  if (!result) return {}

  const { page } = result
  return {
    title: page.seo_meta_title || page.title,
    description: page.seo_meta_description || undefined,
    openGraph: {
      title: page.seo_meta_title || page.title,
      description: page.seo_meta_description || undefined,
      images: page.seo_og_image_url ? [{ url: page.seo_og_image_url }] : undefined,
    },
  }
}

// Preview route for homepage (slug = "/")
export default async function HomepagePreview({ params, searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const result = await getCmsPagePreview("/", token)

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
