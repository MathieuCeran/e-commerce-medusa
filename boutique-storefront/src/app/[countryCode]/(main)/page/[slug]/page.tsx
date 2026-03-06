import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPage } from "@lib/data/cms-pages"
import { getRegion } from "@lib/data/regions"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { GjsRenderer } from "./gjs-renderer"
import { HttpTypes } from "@medusajs/types"
import ProductsGridServer from "./products-grid-server"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

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

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
  gjsComponents?: unknown
  gjsStyles?: unknown
  // Legacy Puck format support
  content?: unknown[]
  root?: unknown
}

// Parse products-grid placeholders from HTML
function extractProductsGrids(html: string): Array<{
  fullMatch: string
  collection: string
  limit: number
  columns: string
  showViewAll: boolean
}> {
  const grids: Array<{
    fullMatch: string
    collection: string
    limit: number
    columns: string
    showViewAll: boolean
  }> = []

  const regex = /<section[^>]*data-component="products-grid"[^>]*>[\s\S]*?<\/section>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const collectionMatch = tag.match(/data-collection="([^"]*)"/)
    const limitMatch = tag.match(/data-limit="([^"]*)"/)
    const columnsMatch = tag.match(/data-columns="([^"]*)"/)
    const viewAllMatch = tag.match(/data-show-view-all="([^"]*)"/)

    grids.push({
      fullMatch: tag,
      collection: collectionMatch?.[1] || "",
      limit: parseInt(limitMatch?.[1] || "4"),
      columns: columnsMatch?.[1] || "4",
      showViewAll: viewAllMatch?.[1] === "true",
    })
  }

  return grids
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

  const content = page.content as GjsContent

  // Handle GrapeJS format
  if (content?.gjsHtml !== undefined) {
    let html = content.gjsHtml || ""
    const css = content.gjsCss || ""

    // Check for products-grid components that need server-side data
    const productGrids = extractProductsGrids(html)
    const productGridComponents: Array<{
      placeholder: string
      collection: string
      limit: number
      columns: string
      showViewAll: boolean
      products: HttpTypes.StoreProduct[]
      region: HttpTypes.StoreRegion | null
    }> = []

    if (region && productGrids.length > 0) {
      for (const grid of productGrids) {
        let products: HttpTypes.StoreProduct[] = []

        if (grid.collection) {
          try {
            const collection = await getCollectionByHandle(grid.collection)
            if (collection) {
              const { response } = await listProducts({
                regionId: region.id,
                queryParams: {
                  collection_id: [collection.id],
                  limit: grid.limit,
                  fields: "*variants.calculated_price",
                },
              })
              products = response.products
            }
          } catch (error) {
            console.error(`Failed to fetch products for collection ${grid.collection}:`, error)
          }
        }

        // Replace the placeholder HTML with a marker
        const markerId = `__PRODUCTS_GRID_${productGridComponents.length}__`
        html = html.replace(grid.fullMatch, `<div data-products-grid-marker="${markerId}"></div>`)

        productGridComponents.push({
          placeholder: markerId,
          ...grid,
          products,
          region,
        })
      }
    }

    // Split HTML at product grid markers and interleave React components
    if (productGridComponents.length > 0) {
      const parts: React.ReactNode[] = []
      let remaining = html

      for (let i = 0; i < productGridComponents.length; i++) {
        const marker = `<div data-products-grid-marker="__PRODUCTS_GRID_${i}__"></div>`
        const idx = remaining.indexOf(marker)

        if (idx >= 0) {
          const before = remaining.substring(0, idx)
          if (before) {
            parts.push(<div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: before }} />)
          }

          const pg = productGridComponents[i]
          parts.push(
            <ProductsGridServer
              key={`pg-${i}`}
              products={pg.products}
              region={pg.region!}
              columns={pg.columns}
              collection={pg.collection}
              showViewAll={pg.showViewAll}
            />
          )

          remaining = remaining.substring(idx + marker.length)
        }
      }

      if (remaining) {
        parts.push(<div key="html-last" dangerouslySetInnerHTML={{ __html: remaining }} />)
      }

      return (
        <div>
          {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
          {parts}
        </div>
      )
    }

    return (
      <div>
        <GjsRenderer html={html} css={css} />
      </div>
    )
  }

  // Legacy Puck format fallback - render nothing for old content
  return (
    <div>
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    </div>
  )
}
