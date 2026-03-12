import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SiteFooterProps = {
  variant: string
  storeName: string
  categories: { id: string; name: string; handle: string }[]
  collections: { id: string; title: string; handle: string }[]
}

export default function SiteFooter({
  variant,
  storeName,
  categories,
  collections,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-ui-border-base w-full bg-ui-bg-subtle">
      <div className="content-container flex flex-col w-full">
        {variant === "full" && (
          <>
            <div className="flex flex-col gap-10 xsmall:flex-row xsmall:justify-between py-20 px-4 md:px-0">
              <div className="flex flex-col gap-4 max-w-xs">
                <LocalizedClientLink
                  href="/"
                  className="txt-compact-xlarge-plus hover:opacity-80 uppercase text-3xl tracking-tight font-bold"
                >
                  {storeName}
                </LocalizedClientLink>
                <Text className="txt-small opacity-60">
                  Votre boutique de confiance pour des produits de qualité.
                </Text>
              </div>

              {categories.length > 0 && (
                <div className="flex flex-col gap-4">
                  <span className="txt-small-plus uppercase tracking-widest font-semibold opacity-50">
                    Catégories
                  </span>
                  <div className="flex flex-col gap-3">
                    {categories.slice(0, 6).map((c) => (
                      <LocalizedClientLink
                        key={c.id}
                        href={`/categories/${c.handle}`}
                        className="txt-small hover:opacity-70 transition-opacity uppercase tracking-wide"
                      >
                        {c.name}
                      </LocalizedClientLink>
                    ))}
                  </div>
                </div>
              )}

              {collections.length > 0 && (
                <div className="flex flex-col gap-4">
                  <span className="txt-small-plus uppercase tracking-widest font-semibold opacity-50">
                    Collections
                  </span>
                  <div className="flex flex-col gap-3">
                    {collections.slice(0, 6).map((c) => (
                      <LocalizedClientLink
                        key={c.id}
                        href={`/collections/${c.handle}`}
                        className="txt-small hover:opacity-70 transition-opacity uppercase tracking-wide"
                      >
                        {c.title}
                      </LocalizedClientLink>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex w-full mb-16 justify-between items-end opacity-60 txt-small border-t border-ui-border-base pt-4 mt-10">
              <Text className="txt-compact-small">
                © {new Date().getFullYear()} {storeName}. Tous droits réservés.
              </Text>
              <div className="flex gap-4">
                <LocalizedClientLink href="/privacy-policy" className="hover:opacity-100">
                  Confidentialité
                </LocalizedClientLink>
                <LocalizedClientLink href="/terms-of-use" className="hover:opacity-100">
                  CGV
                </LocalizedClientLink>
              </div>
            </div>
          </>
        )}

        {variant === "minimal" && (
          <div className="flex flex-col xsmall:flex-row items-center justify-between py-8 px-4 md:px-0 gap-4">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:opacity-80 uppercase font-bold"
            >
              {storeName}
            </LocalizedClientLink>
            <div className="flex gap-6 opacity-60 txt-small">
              <LocalizedClientLink href="/privacy-policy" className="hover:opacity-100">
                Confidentialité
              </LocalizedClientLink>
              <LocalizedClientLink href="/terms-of-use" className="hover:opacity-100">
                CGV
              </LocalizedClientLink>
              <LocalizedClientLink href="/contact" className="hover:opacity-100">
                Contact
              </LocalizedClientLink>
            </div>
            <Text className="txt-compact-small opacity-60">
              © {new Date().getFullYear()} {storeName}
            </Text>
          </div>
        )}
      </div>
    </footer>
  )
}
