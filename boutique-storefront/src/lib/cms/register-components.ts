import { registerComponent, type RenderContext } from "./component-registry"
import ProductsGridServer from "./components/products-grid-server"
import VideoEmbed from "./components/video-embed"
import Tabs from "./components/tabs"
import StatsCounter from "./components/stats-counter"
import TestimonialsCarousel from "./components/testimonials-carousel"
import AnnouncementBar from "./components/announcement-bar"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"

// ── Products Grid ───────────────────────────────────────────────────────────

async function fetchProductsGridData(
  attrs: Record<string, string>,
  context: RenderContext
): Promise<Record<string, any>> {
  const collection = attrs["data-collection"] || ""
  const limit = parseInt(attrs["data-limit"] || "4", 10)
  const columns = attrs["data-columns"] || "4"
  const showViewAll = attrs["data-show-view-all"] === "true"

  if (!collection) {
    return { products: [], region: context.region, columns, collection, showViewAll }
  }

  try {
    const collectionData = await getCollectionByHandle(collection)
    if (!collectionData) {
      return { products: [], region: context.region, columns, collection, showViewAll }
    }

    const { response } = await listProducts({
      regionId: context.region.id,
      queryParams: {
        collection_id: [collectionData.id],
        limit,
        fields: "*variants.calculated_price",
      },
    })

    return {
      products: response.products || [],
      region: context.region,
      columns,
      collection,
      showViewAll,
    }
  } catch {
    return { products: [], region: context.region, columns, collection, showViewAll }
  }
}

// ── Registration ────────────────────────────────────────────────────────────

let registered = false

export function registerAllComponents() {
  if (registered) return
  registered = true

  registerComponent("products-grid", {
    component: ProductsGridServer,
    serverDataFn: fetchProductsGridData,
  })

  // site-header and site-footer are rendered as static HTML from GrapesJS
  // (their outerHTML is preserved as-is — no React hydration)

  // Client-only hydrated components (no server data needed)
  registerComponent("video-embed", { component: VideoEmbed })
  registerComponent("tabs", { component: Tabs })
  registerComponent("stats-counter", { component: StatsCounter })
  registerComponent("testimonials-carousel", { component: TestimonialsCarousel })
  registerComponent("announcement-bar", { component: AnnouncementBar })
}
