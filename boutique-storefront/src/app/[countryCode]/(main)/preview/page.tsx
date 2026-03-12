import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPagePreview } from "@lib/data/cms-pages"
import { getRegion } from "@lib/data/regions"
import { CmsPageRenderer } from "@lib/cms/cms-page-renderer"

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
  const { countryCode } = await params
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const [result, region] = await Promise.all([
    getCmsPagePreview("/", token),
    getRegion(countryCode),
  ])

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

  const html = content?.gjsHtml || ""
  const css = content?.gjsCss || ""

  return (
    <CmsPageRenderer
      html={html}
      css={css}
      layout={layout || null}
      context={{ region: region!, countryCode }}
      isPreview
      slug="/"
    />
  )
}
