import React, { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductActionsWrapper from "../product-actions-wrapper"
import ImageGalleryInteractive from "@modules/products/components/image-gallery-interactive"

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

/**
 * Template Galerie
 * Grande galerie d'images en haut avec navigation
 * Informations produit centrées en dessous
 */
const VariantGalerie: React.FC<Props> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  return (
    <>
      {/* Debug: Indicateur de template */}
      <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
        Template: Galerie
      </div>

      {/* Section Galerie - Composant Client pour l'interactivité */}
      <ImageGalleryInteractive
        images={images}
        productTitle={product.title || "Produit"}
        variant="galerie"
      />

      {/* Section Informations */}
      <div className="content-container py-10 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* En-tête produit */}
          <div className="text-center mb-10">
            {/* Collection */}
            {product.collection && (
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="inline-block text-sm text-ui-fg-muted hover:text-ui-fg-base transition-colors mb-3"
              >
                {product.collection.title}
              </LocalizedClientLink>
            )}

            {/* Titre */}
            <Heading
              level="h1"
              className="text-4xl lg:text-5xl font-bold text-ui-fg-base mb-4"
            >
              {product.title}
            </Heading>

            {/* Sous-titre */}
            {product.subtitle && (
              <Text className="text-xl text-ui-fg-subtle max-w-2xl mx-auto">
                {product.subtitle}
              </Text>
            )}
          </div>

          {/* Grille: Actions + Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Actions */}
            <div className="lg:order-2">
              <div className="lg:sticky lg:top-24 bg-ui-bg-subtle rounded-xl p-6 lg:p-8">
                <Suspense
                  fallback={
                    <ProductActions
                      disabled={true}
                      product={product}
                      region={region}
                    />
                  }
                >
                  <ProductActionsWrapper id={product.id} region={region} />
                </Suspense>
              </div>
            </div>

            {/* Description et détails */}
            <div className="lg:order-1 space-y-8">
              {/* Description */}
              {product.description && (
                <div>
                  <Heading level="h2" className="text-xl font-semibold mb-4">
                    À propos de ce produit
                  </Heading>
                  <Text className="text-ui-fg-subtle leading-relaxed whitespace-pre-line">
                    {product.description}
                  </Text>
                </div>
              )}

              {/* Détails techniques */}
              <div className="border-t border-ui-border-base pt-8">
                <ProductTabs product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Produits associés */}
      <div className="bg-ui-bg-subtle">
        <div className="content-container py-12 lg:py-16">
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default VariantGalerie
