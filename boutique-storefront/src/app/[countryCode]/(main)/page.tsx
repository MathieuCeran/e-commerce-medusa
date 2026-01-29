import { Metadata } from "next"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections, getCollectionByHandle } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import { getCmsPage } from "@lib/data/cms-pages"
import { PuckRenderer } from "./page/[slug]/puck-renderer"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const homePage = await getCmsPage("/")

  if (homePage) {
    return {
      title: homePage.seo_meta_title || homePage.title || "Home",
      description: homePage.seo_meta_description || undefined,
      openGraph: {
        title: homePage.seo_meta_title || homePage.title,
        description: homePage.seo_meta_description || undefined,
        images: homePage.seo_og_image_url
          ? [{ url: homePage.seo_og_image_url }]
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

export default async function Home(props: Props) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)

  // Check for CMS homepage first (slug = "/")
  const homePage = await getCmsPage("/")

  if (homePage && region) {
    const enrichedContent = await injectProductsData(
      homePage.content as PuckContent,
      region
    )
    return <PuckRenderer data={enrichedContent} />
  }

  if (homePage) {
    return <PuckRenderer data={homePage.content} />
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
