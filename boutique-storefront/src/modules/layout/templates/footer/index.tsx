import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getThemeSettings } from "@lib/data/cms-pages"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  const [{ collections }, productCategories, themeSettings] = await Promise.all([
    listCollections({ fields: "*products" }),
    listCategories(),
    getThemeSettings(),
  ])

  const footerVariant = themeSettings?.footer_variant || "one"
  const storeName = themeSettings?.store_name || "Medusa Store"

  return (
    <footer
      data-site-footer
      className="border-t border-ui-border-base w-full"
      style={{
        backgroundColor: "var(--theme-footer-bg, #111827)",
        color: "var(--theme-footer-text, #ffffff)",
      }}
    >
      <div className="content-container flex flex-col w-full">
        
        {/* Variant 'one': Modern Grid (4 Columns) */}
        {footerVariant === "one" && (
          <>
            <div className="flex flex-col gap-10 xsmall:flex-row xsmall:justify-between py-20 px-4 md:px-0">
              
              {/* Column 1: Brand */}
              <div className="flex flex-col gap-4 max-w-xs">
                <LocalizedClientLink
                  href="/"
                  className="txt-compact-xlarge-plus hover:opacity-80 uppercase text-3xl tracking-tight font-bold"
                >
                  {storeName}
                </LocalizedClientLink>
                <Text className="txt-small opacity-60">
                  Crafted for the modern era. Quality and style in every detail.
                </Text>
              </div>

              {/* Column 2: Categories */}
              <div className="flex flex-col gap-4">
                <span className="txt-small-plus uppercase tracking-widest font-semibold opacity-50">
                  Shop
                </span>
                <div className="flex flex-col gap-3">
                  {productCategories?.slice(0, 6).map((c) => (
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

              {/* Column 3: Collections */}
              <div className="flex flex-col gap-4">
                <span className="txt-small-plus uppercase tracking-widest font-semibold opacity-50">
                  Collections
                </span>
                <div className="flex flex-col gap-3">
                  {collections?.slice(0, 6).map((c) => (
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

              {/* Column 4: Newsletter */}
              <div className="flex flex-col gap-4 max-w-xs">
                <span className="txt-small-plus uppercase tracking-widest font-semibold opacity-50">
                  Newsletter
                </span>
                <Text className="txt-small opacity-60">
                  Subscribe to receive updates, access to exclusive deals, and more.
                </Text>
                <div className="flex items-center border-b border-current opacity-80 pb-1">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-transparent border-none outline-none w-full placeholder:text-current opacity-50 txt-small"
                  />
                  <button className="uppercase txt-small font-bold hover:opacity-70">
                    Join
                  </button>
                </div>
              </div>

            </div>
            <div className="flex w-full mb-16 justify-between items-end opacity-60 txt-small border-t border-ui-border-base pt-4 mt-10">
              <Text className="txt-compact-small">
                © {new Date().getFullYear()} {storeName}. All rights reserved.
              </Text>
              <div className="flex gap-4">
                 <LocalizedClientLink href="/privacy-policy" className="hover:opacity-100">Privacy Policy</LocalizedClientLink>
                 <LocalizedClientLink href="/terms-of-use" className="hover:opacity-100">Terms of Use</LocalizedClientLink>
              </div>
            </div>
          </>
        )}

        {/* Variant 'two': Expanded (Columns) */}
        {footerVariant === "two" && (
          <>
            <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-40">
              <div>
                <LocalizedClientLink
                  href="/"
                  className="txt-compact-xlarge-plus hover:opacity-80 uppercase"
                >
                  {storeName}
                </LocalizedClientLink>
              </div>
              <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
                {productCategories && productCategories?.length > 0 && (
                  <div className="flex flex-col gap-y-2">
                    <span className="txt-small-plus font-semibold">
                      Categories
                    </span>
                    <ul
                      className="grid grid-cols-1 gap-2"
                      data-testid="footer-categories"
                    >
                      {productCategories?.slice(0, 6).map((c) => {
                        if (c.parent_category) {
                          return
                        }

                        const children =
                          c.category_children?.map((child) => ({
                            name: child.name,
                            handle: child.handle,
                            id: child.id,
                          })) || null

                        return (
                          <li
                            className="flex flex-col gap-2 opacity-80 txt-small"
                            key={c.id}
                          >
                            <LocalizedClientLink
                              className={clx(
                                "hover:opacity-100",
                                children && "txt-small-plus"
                              )}
                              href={`/categories/${c.handle}`}
                              data-testid="category-link"
                            >
                              {c.name}
                            </LocalizedClientLink>
                            {children && (
                              <ul className="grid grid-cols-1 ml-3 gap-2">
                                {children &&
                                  children.map((child) => (
                                    <li key={child.id}>
                                      <LocalizedClientLink
                                        className="hover:opacity-100"
                                        href={`/categories/${child.handle}`}
                                        data-testid="category-link"
                                      >
                                        {child.name}
                                      </LocalizedClientLink>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {collections && collections.length > 0 && (
                  <div className="flex flex-col gap-y-2">
                    <span className="txt-small-plus font-semibold">
                      Collections
                    </span>
                    <ul
                      className={clx(
                        "grid grid-cols-1 gap-2 opacity-80 txt-small",
                        {
                          "grid-cols-2": (collections?.length || 0) > 3,
                        }
                      )}
                    >
                      {collections?.slice(0, 6).map((c) => (
                        <li key={c.id}>
                          <LocalizedClientLink
                            className="hover:opacity-100"
                            href={`/collections/${c.handle}`}
                          >
                            {c.title}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-col gap-y-2">
                  <span className="txt-small-plus font-semibold">Links</span>
                  <ul className="grid grid-cols-1 gap-y-2 opacity-80 txt-small">
                    <li>
                      <a
                        href="https://github.com/medusajs"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:opacity-100"
                      >
                        GitHub
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://docs.medusajs.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:opacity-100"
                      >
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://github.com/medusajs/nextjs-starter-medusa"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:opacity-100"
                      >
                        Source code
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex w-full mb-16 justify-between opacity-60">
              <Text className="txt-compact-small">
                © {new Date().getFullYear()} {storeName}. All rights reserved.
              </Text>
              <MedusaCTA />
            </div>
          </>
        )}
      </div>
    </footer>
  )
}
