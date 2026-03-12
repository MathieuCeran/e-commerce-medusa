import { Metadata } from "next"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getCmsPage } from "@lib/data/cms-pages"
import { CmsPageRenderer } from "@lib/cms/cms-page-renderer"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const result = await getCmsPage("/")

  if (result) {
    const { page } = result
    return {
      title: page.seo_meta_title || page.title || "Home",
      description: page.seo_meta_description || undefined,
      openGraph: {
        title: page.seo_meta_title || page.title,
        description: page.seo_meta_description || undefined,
        images: page.seo_og_image_url
          ? [{ url: page.seo_og_image_url }]
          : undefined,
      },
    }
  }

  return {
    title: "Medusa Next.js Starter Template",
    description:
      "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
  }
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: unknown
  gjsStyles?: unknown
}

export default async function Home(props: Props) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)

  // Check for CMS homepage first (slug = "/")
  const result = await getCmsPage("/")

  if (result && region) {
    const { page, layout } = result
    const content = page.content as GjsContent

    // Handle GrapeJS format (gjsHtml present, or layout provides the HTML)
    if (content?.gjsHtml !== undefined || layout) {
      const html = content.gjsHtml || ""
      const css = content.gjsCss || ""

      return (
        <CmsPageRenderer
          html={html}
          css={css}
          layout={layout || null}
          context={{ region, countryCode }}
        />
      )
    }

    // Legacy Puck format - show fallback
    return (
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    )
  }

  // Fallback to default homepage
  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
