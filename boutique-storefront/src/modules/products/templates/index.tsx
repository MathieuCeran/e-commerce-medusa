import React from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import VariantClassique from "./variant-classique"
import VariantGalerie from "./variant-galerie"
import VariantImmersif from "./variant-immersif"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  templateVariant?: "classique" | "galerie" | "immersif"
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  templateVariant = "classique",
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const props = {
    product,
    region,
    countryCode,
    images,
  }

  switch (templateVariant) {
    case "galerie":
      return <VariantGalerie {...props} />
    case "immersif":
      return <VariantImmersif {...props} />
    case "classique":
    default:
      return <VariantClassique {...props} />
  }
}

export default ProductTemplate
