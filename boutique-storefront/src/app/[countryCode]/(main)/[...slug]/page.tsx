import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPage, getCmsPagePreview, getAllPublishedCmsSlugs } from "@lib/data/cms-pages"
import { getRegion } from "@lib/data/regions"
import { listRegions } from "@lib/data/regions"
import { CmsPageRenderer } from "@lib/cms/cms-page-renderer"

export const revalidate = 60

export async function generateStaticParams() {
  const [slugs, regions] = await Promise.all([
    getAllPublishedCmsSlugs(),
    listRegions(),
  ])

  const countryCodes = regions
    ?.flatMap((r) => r.countries?.map((c) => c.iso_2))
    .filter((c): c is string => Boolean(c)) || []

  return countryCodes.flatMap((countryCode) =>
    slugs.map((slug) => ({
      countryCode,
      slug: slug.split("/"),
    }))
  )
}

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

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.seo_meta_title || page.title,
      description: page.seo_meta_description || undefined,
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CmsPageRenderer
          html={html}
          css={css}
          layout={layout || null}
          context={{ region: region!, countryCode }}
          isPreview={isPreview}
          slug={compositeSlug}
        />
      </>
    )
  }

  // No renderable content
  notFound()
}
