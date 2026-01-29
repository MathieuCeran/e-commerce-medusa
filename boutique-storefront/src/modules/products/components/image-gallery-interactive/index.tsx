"use client"

import React, { useState } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type ImageGalleryInteractiveProps = {
  images: HttpTypes.StoreProductImage[]
  productTitle: string
  variant?: "galerie" | "immersif"
}

/**
 * Composant client pour la navigation interactive entre images
 */
const ImageGalleryInteractive: React.FC<ImageGalleryInteractiveProps> = ({
  images,
  productTitle,
  variant = "galerie",
}) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasImages = images && images.length > 0
  const activeImage = hasImages ? images[activeIndex] : null

  if (variant === "immersif") {
    return (
      <>
        {/* Image de fond pour Immersif */}
        {activeImage?.url && (
          <div className="absolute inset-0">
            <Image
              src={activeImage.url}
              alt={productTitle || "Image produit"}
              fill
              priority
              className="object-cover opacity-80"
              sizes="100vw"
            />
          </div>
        )}

        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

        {/* Indicateurs d'images en bas */}
        {hasImages && images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={clx(
                  "h-1 rounded-full transition-all duration-300",
                  idx === activeIndex
                    ? "w-10 bg-white"
                    : "w-5 bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Voir image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </>
    )
  }

  // Variant Galerie (default)
  return (
    <div className="bg-ui-bg-subtle">
      <div className="content-container py-6">
        {/* Grande image principale */}
        <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden rounded-xl bg-white mb-4">
          {activeImage?.url && (
            <Image
              src={activeImage.url}
              alt={productTitle || "Image produit"}
              fill
              priority
              className="object-contain"
              sizes="100vw"
            />
          )}

          {/* Navigation flèches */}
          {images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
                aria-label="Image précédente"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
                aria-label="Image suivante"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Indicateur de position */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full">
              <span className="text-white text-sm font-medium">
                {activeIndex + 1} / {images.length}
              </span>
            </div>
          )}
        </div>

        {/* Miniatures */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((image, idx) => (
              <button
                key={image.id}
                onClick={() => setActiveIndex(idx)}
                className={clx(
                  "relative flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden transition-all",
                  idx === activeIndex
                    ? "ring-2 ring-ui-fg-base ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                {image.url && (
                  <Image
                    src={image.url}
                    alt={`${productTitle} - Miniature ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGalleryInteractive
