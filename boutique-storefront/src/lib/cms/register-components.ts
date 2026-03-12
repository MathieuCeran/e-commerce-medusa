import { registerComponent, type RenderContext } from "./component-registry"
import ProductsGridServer from "./components/products-grid-server"
import SiteHeader from "./components/site-header"
import SiteFooter from "./components/site-footer"
import VideoEmbed from "./components/video-embed"
import Tabs from "./components/tabs"
import StatsCounter from "./components/stats-counter"
import TestimonialsCarousel from "./components/testimonials-carousel"
import AnnouncementBar from "./components/announcement-bar"
import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { getThemeSettings } from "@lib/data/cms-pages"
import { listCategories } from "@lib/data/categories"

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

// ── Site Header ─────────────────────────────────────────────────────────────

async function fetchHeaderData(
  attrs: Record<string, string>,
  _context: RenderContext
): Promise<Record<string, any>> {
  const variant = attrs["data-variant"] || "simple"

  const [regions, locales, currentLocale, themeSettings, productCategories] = await Promise.all([
    listRegions(),
    listLocales(),
    getLocale(),
    getThemeSettings(),
    listCategories(),
  ])

  return {
    variant,
    regions: regions || [],
    locales: locales || [],
    currentLocale: currentLocale || "en",
    categories: (productCategories || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
    })),
    storeName: themeSettings?.store_name || "Boutique",
    logoUrl: themeSettings?.logo_url || undefined,
  }
}

// ── Site Footer ─────────────────────────────────────────────────────────────

async function fetchFooterData(
  attrs: Record<string, string>,
  _context: RenderContext
): Promise<Record<string, any>> {
  const variant = attrs["data-variant"] || "full"

  const [{ collections }, productCategories, themeSettings] = await Promise.all([
    listCollections({ fields: "id,title,handle" }),
    listCategories(),
    getThemeSettings(),
  ])

  return {
    variant,
    storeName: themeSettings?.store_name || "Boutique",
    categories: (productCategories || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
    })),
    collections: (collections || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
    })),
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

  registerComponent("site-header", {
    component: SiteHeader,
    serverDataFn: fetchHeaderData,
  })

  registerComponent("site-footer", {
    component: SiteFooter,
    serverDataFn: fetchFooterData,
  })

  // Client-only hydrated components (no server data needed)
  registerComponent("video-embed", { component: VideoEmbed })
  registerComponent("tabs", { component: Tabs })
  registerComponent("stats-counter", { component: StatsCounter })
  registerComponent("testimonials-carousel", { component: TestimonialsCarousel })
  registerComponent("announcement-bar", { component: AnnouncementBar })
}
