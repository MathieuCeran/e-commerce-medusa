import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getCmsPage } from "@lib/data/cms-pages"
import { getRegion } from "@lib/data/regions"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { PuckRenderer } from "./puck-renderer"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, countryCode } = await params

  // Redirect home slug to homepage to avoid duplicate content
  if (slug === "home") {
    return {}
  }

  const page = await getCmsPage(slug)

  if (!page) return {}

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

type PuckContent = {
  content?: Array<{
    type: string
    props?: Record<string, unknown>
  }>
  root?: Record<string, unknown>
}

async function injectProductsData(
  content: PuckContent,
  region: HttpTypes.StoreRegion
): Promise<PuckContent> {
  if (!content.content) return content

  const enrichedContent = await Promise.all(
    content.content.map(async (item) => {
      if (item.type === "ProductsGrid" && item.props) {
        const collectionHandle = item.props.collectionHandle as string
        const limit = (item.props.limit as number) || 4

        let products: HttpTypes.StoreProduct[] = []

        if (collectionHandle) {
          try {
            const collection = await getCollectionByHandle(collectionHandle)
            if (collection) {
              const { response } = await listProducts({
                regionId: region.id,
                queryParams: {
                  collection_id: [collection.id],
                  limit,
                  fields: "*variants.calculated_price",
                },
              })
              products = response.products
            }
          } catch (error) {
            console.error(`Failed to fetch products for collection ${collectionHandle}:`, error)
          }
        }

        return {
          ...item,
          props: {
            ...item.props,
            _products: products,
            _region: region,
          },
        }
      }
      return item
    })
  )

  return {
    ...content,
    content: enrichedContent,
  }
}

export default async function CmsPageRoute({ params }: Props) {
  const { slug, countryCode } = await params
  const [page, region] = await Promise.all([
    getCmsPage(slug),
    getRegion(countryCode),
  ])

  if (!page) {
    notFound()
  }

  let enrichedContent = page.content as PuckContent

  if (region) {
    enrichedContent = await injectProductsData(enrichedContent, region)
  }

  return (
    <div>
      <PuckRenderer data={enrichedContent} />
    </div>
  )
}
