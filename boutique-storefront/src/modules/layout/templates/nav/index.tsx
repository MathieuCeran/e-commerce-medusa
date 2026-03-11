import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { getThemeSettings } from "@lib/data/cms-pages"
import { listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { User } from "@medusajs/icons"

export default async function Nav() {
  const [regions, locales, currentLocale, themeSettings, productCategories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    getThemeSettings(),
    listCategories(),
  ])

  const headerVariant = themeSettings?.header_variant || "one"
  const storeName = themeSettings?.store_name || "Medusa Store"
  const logoUrl = themeSettings?.logo_url

  return (
    <div className="sticky top-0 inset-x-0 z-50 group" data-site-nav>
      <header
        className="relative h-20 mx-auto border-b duration-200 border-ui-border-base"
        style={{
          backgroundColor: "var(--theme-header-bg, #ffffff)",
          color: "var(--theme-header-text, #111827)",
        }}
      >
        <nav className="content-container txt-xsmall-plus flex items-center justify-between w-full h-full text-small-regular">
          
          {/* Variant 'one': Standard (Logo Left - Links Center - Icons Right) */}
          {headerVariant === "one" && (
            <>
              {/* Left: Logo & Mobile Menu */}
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

              {/* Center: Desktop Categories Menu */}
              <div className="hidden medium:flex items-center justify-center gap-8 h-full flex-1">
                {productCategories && productCategories.slice(0, 5).map((c) => (
                  <LocalizedClientLink
                    key={c.id}
                    className="hover:opacity-60 transition-opacity text-sm font-medium uppercase tracking-widest"
                    href={`/categories/${c.handle}`}
                  >
                    {c.name}
                  </LocalizedClientLink>
                ))}
              </div>

              {/* Right: Icons */}
              <div className="flex items-center gap-x-4 h-full justify-end flex-1 basis-0">
                <div className="hidden small:flex items-center gap-x-4 h-full">
                  <LocalizedClientLink className="hover:opacity-80" href="/account">
                    <User />
                  </LocalizedClientLink>
                </div>
                <Suspense fallback={<LocalizedClientLink className="hover:opacity-80 flex gap-2" href="/cart">Cart (0)</LocalizedClientLink>}>
                  <CartButton />
                </Suspense>
              </div>
            </>
          )}

          {/* Variant 'two': Centered (Logo Center) */}
          {headerVariant === "two" && (
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
                <Suspense fallback={<LocalizedClientLink className="hover:opacity-80 flex gap-2" href="/cart">Cart (0)</LocalizedClientLink>}>
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
