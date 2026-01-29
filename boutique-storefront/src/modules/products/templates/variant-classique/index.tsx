import React, { Suspense } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"

import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductActionsWrapper from "../product-actions-wrapper"

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

/**
 * Template Classique
 * Design épuré avec image principale à gauche et informations à droite
 * Grande description détaillée en bas de page
 */
const VariantClassique: React.FC<Props> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  const mainImage = images[0]
  const thumbnails = images.slice(1, 5)

  return (
    <>
      {/* Debug: Indicateur de template */}
      <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
        Template: Classique
      </div>

      {/* Section principale */}
      <div className="content-container py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Colonne gauche - Images */}
          <div className="space-y-4">
            {/* Image principale */}
            <Container className="relative aspect-[4/5] w-full overflow-hidden bg-ui-bg-subtle rounded-lg">
              {mainImage?.url && (
                <Image
                  src={mainImage.url}
                  alt={product.title || "Image produit"}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}
            </Container>

            {/* Miniatures */}
            {thumbnails.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {thumbnails.map((image, idx) => (
                  <Container
                    key={image.id}
                    className="relative aspect-square overflow-hidden bg-ui-bg-subtle rounded-md cursor-pointer hover:ring-2 hover:ring-ui-fg-base transition-all"
                  >
                    {image.url && (
                      <Image
                        src={image.url}
                        alt={`${product.title} - Image ${idx + 2}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    )}
                  </Container>
                ))}
              </div>
            )}
          </div>

          {/* Colonne droite - Informations */}
          <div className="flex flex-col">
            {/* Fil d'Ariane / Collection */}
            {product.collection && (
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="text-sm text-ui-fg-muted hover:text-ui-fg-base transition-colors mb-2"
              >
                {product.collection.title}
              </LocalizedClientLink>
            )}

            {/* Titre */}
            <Heading
              level="h1"
              className="text-3xl lg:text-4xl font-semibold text-ui-fg-base mb-4"
            >
              {product.title}
            </Heading>

            {/* Description courte */}
            {product.subtitle && (
              <Text className="text-lg text-ui-fg-subtle mb-6">
                {product.subtitle}
              </Text>
            )}

            {/* Séparateur */}
            <div className="w-16 h-px bg-ui-border-base mb-6" />

            {/* Actions (variantes, prix, ajout panier) */}
            <div className="mb-8">
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

            {/* Accordéons d'informations */}
            <div className="border-t border-ui-border-base pt-6">
              <ProductTabs product={product} />
            </div>
          </div>
        </div>
      </div>

      {/* Section description détaillée */}
      {product.description && (
        <div className="bg-ui-bg-subtle">
          <div className="content-container py-12 lg:py-16">
            <div className="max-w-3xl">
              <Heading level="h2" className="text-2xl font-semibold mb-6">
                Description
              </Heading>
              <Text className="text-ui-fg-subtle leading-relaxed whitespace-pre-line">
                {product.description}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Produits associés */}
      <div className="content-container py-12 lg:py-16">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default VariantClassique
