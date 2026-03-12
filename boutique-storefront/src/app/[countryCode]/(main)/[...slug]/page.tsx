import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPage, getCmsPagePreview } from "@lib/data/cms-pages"
import { getRegion } from "@lib/data/regions"
import { CmsPageRenderer } from "@lib/cms/cms-page-renderer"

type Props = {
  params: Promise<{ countryCode: string; slug: string[] }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug: slugSegments } = await params
  const { token } = await searchParams

  if (slugSegments.length > 2) return {}

  const compositeSlug = slugSegments.join("/")
  const result = token
    ? await getCmsPagePreview(compositeSlug, token)
    : await getCmsPage(compositeSlug)

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

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: unknown
  gjsStyles?: unknown
  content?: unknown[]
  root?: unknown
}

export default async function CmsPageRoute({ params, searchParams }: Props) {
  const { slug: slugSegments, countryCode } = await params
  const { token } = await searchParams

  // Max 2 segments (parent/child). More = 404.
  if (slugSegments.length > 2) {
    notFound()
  }

  const compositeSlug = slugSegments.join("/")
  const isPreview = !!token

  const [result, region] = await Promise.all([
    isPreview
      ? getCmsPagePreview(compositeSlug, token!)
      : getCmsPage(compositeSlug),
    getRegion(countryCode),
  ])

  if (!result) {
    notFound()
  }

  const { page, layout } = result
  const content = page.content as GjsContent

  // Handle GrapeJS format (gjsHtml present, or layout provides the HTML)
  if (content?.gjsHtml !== undefined || layout) {
    const html = content?.gjsHtml || ""
    const css = content?.gjsCss || ""

    return (
      <CmsPageRenderer
        html={html}
        css={css}
        layout={layout || null}
        context={{ region: region!, countryCode }}
        isPreview={isPreview}
      />
    )
  }

  // Legacy Puck format fallback
  return (
    <div>
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    </div>
  )
}
