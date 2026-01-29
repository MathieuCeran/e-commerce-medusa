import React, { Suspense } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

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
 * Template Immersif
 * Design moderne pleine largeur
 * Mise en avant visuelle maximale du produit
 */
const VariantImmersif: React.FC<Props> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  const hasImages = images && images.length > 0
  const mainImage = hasImages ? images[0] : null

  return (
    <>
      {/* Debug: Indicateur de template */}
      <div className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
        Template: Immersif
      </div>

      {/* Hero Section - Pleine largeur */}
      <div
        className="relative min-h-[60vh] lg:min-h-[75vh] overflow-hidden"
        style={{
          background: hasImages
            ? "#000"
            : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
      >
        {/* Image de fond */}
        {mainImage?.url && (
          <div className="absolute inset-0">
            <Image
              src={mainImage.url}
              alt={product.title || "Image produit"}
              fill
              priority
              className="object-cover opacity-80"
              sizes="100vw"
            />
          </div>
        )}

        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

        {/* Contenu superposé */}
        <div className="relative z-10 h-full min-h-[60vh] lg:min-h-[75vh] flex items-end">
          <div className="content-container w-full pb-10 lg:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end">
              {/* Informations produit */}
              <div className="text-white">
                {/* Collection */}
                {product.collection && (
                  <LocalizedClientLink
                    href={`/collections/${product.collection.handle}`}
                    className="inline-block text-sm text-white/70 hover:text-white transition-colors mb-3 uppercase tracking-wider"
                  >
                    {product.collection.title}
                  </LocalizedClientLink>
                )}

                {/* Titre */}
                <Heading
                  level="h1"
                  className="text-3xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 leading-tight"
                >
                  {product.title}
                </Heading>

                {/* Sous-titre */}
                {product.subtitle && (
                  <Text className="text-base lg:text-lg text-white/80 max-w-lg mb-4">
                    {product.subtitle}
                  </Text>
                )}
              </div>

              {/* Actions flottantes */}
              <div className="lg:max-w-md">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-xl">
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
            </div>
          </div>
        </div>
      </div>

      {/* Section Description */}
      <div className="bg-white">
        <div className="content-container py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
            {/* Description principale */}
            <div className="lg:col-span-2">
              <Heading level="h2" className="text-2xl font-bold mb-5">
                À propos
              </Heading>
              {product.description ? (
                <Text className="text-base text-ui-fg-subtle leading-relaxed whitespace-pre-line">
                  {product.description}
                </Text>
              ) : (
                <Text className="text-base text-ui-fg-muted italic">
                  Aucune description disponible.
                </Text>
              )}
            </div>

            {/* Caractéristiques clés */}
            <div className="space-y-4">
              <Heading level="h3" className="text-lg font-semibold">
                Caractéristiques
              </Heading>
              <div className="space-y-3">
                {product.material && (
                  <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-ui-bg-base flex items-center justify-center">
                      <span className="text-sm">🧵</span>
                    </div>
                    <div>
                      <Text className="text-xs text-ui-fg-muted">Matière</Text>
                      <Text className="text-sm font-medium">
                        {product.material}
                      </Text>
                    </div>
                  </div>
                )}
                {product.origin_country && (
                  <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-ui-bg-base flex items-center justify-center">
                      <span className="text-sm">🌍</span>
                    </div>
                    <div>
                      <Text className="text-xs text-ui-fg-muted">Origine</Text>
                      <Text className="text-sm font-medium">
                        {product.origin_country}
                      </Text>
                    </div>
                  </div>
                )}
                {product.weight && (
                  <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-ui-bg-base flex items-center justify-center">
                      <span className="text-sm">⚖️</span>
                    </div>
                    <div>
                      <Text className="text-xs text-ui-fg-muted">Poids</Text>
                      <Text className="text-sm font-medium">
                        {product.weight} g
                      </Text>
                    </div>
                  </div>
                )}
                {!product.material &&
                  !product.origin_country &&
                  !product.weight && (
                    <Text className="text-sm text-ui-fg-muted italic p-3">
                      Aucune caractéristique renseignée.
                    </Text>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Galerie secondaire */}
      {hasImages && images.length > 1 && (
        <div className="bg-ui-bg-subtle py-10 lg:py-12">
          <div className="content-container">
            <Heading level="h2" className="text-xl font-bold mb-6 text-center">
              Galerie
            </Heading>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {images.map((image, idx) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden"
                >
                  {image.url && (
                    <Image
                      src={image.url}
                      alt={`${product.title} - Image ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Détails supplémentaires */}
      <div className="bg-white">
        <div className="content-container py-10 lg:py-12">
          <div className="max-w-3xl mx-auto">
            <ProductTabs product={product} />
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

export default VariantImmersif
