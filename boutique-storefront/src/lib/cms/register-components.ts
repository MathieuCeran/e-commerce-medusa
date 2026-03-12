import { registerComponent, type RenderContext } from "./component-registry"
import ProductsGridServer from "./components/products-grid-server"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"

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

let registered = false

export function registerAllComponents() {
  if (registered) return
  registered = true

  registerComponent("products-grid", {
    component: ProductsGridServer,
    serverDataFn: fetchProductsGridData,
  })

  // Additional components will be registered here as they are created
}
