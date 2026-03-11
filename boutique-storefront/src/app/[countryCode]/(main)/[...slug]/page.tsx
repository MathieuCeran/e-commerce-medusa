import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPage, getCmsPagePreview } from "@lib/data/cms-pages"
import { mergeLayoutWithContent, HIDE_DEFAULT_NAV_FOOTER_CSS } from "@lib/data/cms-layout-merge"
import { getRegion } from "@lib/data/regions"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { GjsRenderer } from "./gjs-renderer"
import { HttpTypes } from "@medusajs/types"
import ProductsGridServer from "./products-grid-server"

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
    let html = content?.gjsHtml || ""
    let css = content?.gjsCss || ""
    const hasLayout = !!layout

    // Merge layout HTML/CSS with page content if layout exists
    if (layout) {
      const merged = mergeLayoutWithContent(layout, html, css)
      html = merged.html
      css = merged.css
    }

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

    // Preview banner
    const previewBanner = isPreview ? (
      <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm font-semibold sticky top-0 z-50">
        PREVIEW MODE — This page is not published yet
      </div>
    ) : null

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
        <div {...(hasLayout ? { "data-cms-full-layout": "true" } : {})}>
          {hasLayout && <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />}
          {previewBanner}
          {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
          {parts}
        </div>
      )
    }

    return (
      <div {...(hasLayout ? { "data-cms-full-layout": "true" } : {})}>
        {hasLayout && <style dangerouslySetInnerHTML={{ __html: HIDE_DEFAULT_NAV_FOOTER_CSS }} />}
        {previewBanner}
        <GjsRenderer html={html} css={css} />
      </div>
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
