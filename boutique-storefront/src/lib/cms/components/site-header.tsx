import { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { User } from "@medusajs/icons"

type SiteHeaderProps = {
  variant: string
  regions: HttpTypes.StoreRegion[]
  locales: Locale[]
  currentLocale: string
  categories: { id: string; name: string; handle: string }[]
  storeName: string
  logoUrl?: string
}

export default function SiteHeader({
  variant,
  regions,
  locales,
  currentLocale,
  categories,
  storeName,
  logoUrl,
}: SiteHeaderProps) {
  return (
    <div className="sticky top-0 inset-x-0 z-50" data-site-nav>
      <header
        className="relative h-20 mx-auto border-b duration-200 border-ui-border-base bg-white"
      >
        <nav className="content-container txt-xsmall-plus flex items-center justify-between w-full h-full text-small-regular">
          {(variant === "simple" || variant === "ecommerce") && (
            <>
              <div className="flex items-center flex-1 basis-0 justify-start gap-4">
                <div className="block medium:hidden h-full">
                  <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
                </div>
                <div className="flex items-center h-full">
                  <LocalizedClientLink
                    href="/"
                    className="txt-compact-xlarge-plus hover:opacity-80 uppercase flex items-center gap-2"
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt={storeName} className="h-10 w-auto" />
                    ) : (
                      <span className="text-xl font-bold">{storeName}</span>
                    )}
                  </LocalizedClientLink>
                </div>
              </div>

              <div className="hidden medium:flex items-center justify-center gap-8 h-full flex-1">
                {categories.slice(0, 5).map((c) => (
                  <LocalizedClientLink
                    key={c.id}
                    className="hover:opacity-60 transition-opacity text-sm font-medium uppercase tracking-widest"
                    href={`/categories/${c.handle}`}
                  >
                    {c.name}
                  </LocalizedClientLink>
                ))}
              </div>

              <div className="flex items-center gap-x-4 h-full justify-end flex-1 basis-0">
                <div className="hidden small:flex items-center gap-x-4 h-full">
                  <LocalizedClientLink className="hover:opacity-80" href="/account">
                    <User />
                  </LocalizedClientLink>
                </div>
                <Suspense
                  fallback={
                    <LocalizedClientLink className="hover:opacity-80 flex gap-2" href="/cart">
                      Cart (0)
                    </LocalizedClientLink>
                  }
                >
                  <CartButton />
                </Suspense>
              </div>
            </>
          )}

          {variant === "minimal" && (
            <>
              <div className="flex-1 basis-0 h-full flex items-center">
                <div className="h-full">
                  <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
                </div>
              </div>

              <div className="flex items-center h-full">
                <LocalizedClientLink
                  href="/"
                  className="txt-compact-xlarge-plus hover:opacity-80 uppercase flex items-center gap-2"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
                  ) : (
                    storeName
                  )}
                </LocalizedClientLink>
              </div>

              <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
                <div className="hidden small:flex items-center gap-x-6 h-full">
                  <LocalizedClientLink className="hover:opacity-80" href="/account">
                    Account
                  </LocalizedClientLink>
                </div>
                <Suspense
                  fallback={
                    <LocalizedClientLink className="hover:opacity-80 flex gap-2" href="/cart">
                      Cart (0)
                    </LocalizedClientLink>
                  }
                >
                  <CartButton />
                </Suspense>
              </div>
            </>
          )}
        </nav>
      </header>
    </div>
  )
}
