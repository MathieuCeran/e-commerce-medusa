const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export type CmsPage = {
  id: string
  store_id: string | null
  slug: string
  status: "draft" | "published"
  title: string
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_og_image_url: string | null
  content: Record<string, unknown>
  layout_id?: string | null
  preview_token?: string | null
  created_at: string
  updated_at: string
}

export type CmsLayout = {
  id: string
  html: string
  css: string
  content_position: number
}

export type CmsPageWithLayout = {
  page: CmsPage
  layout: CmsLayout | null
}

// --- Store (public) API ---

export async function getCmsPage(slug: string): Promise<CmsPageWithLayout | null> {
  try {
    // Encode the slug for URL safety (especially for "/" homepage)
    const encodedSlug = encodeURIComponent(slug)
    const res = await fetch(`${BACKEND_URL}/store/cms-pages/${encodedSlug}`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      next: { revalidate: 60, tags: [`cms-page-${slug}`] },
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data.page) return null
    return { page: data.page, layout: data.layout ?? null }
  } catch {
    return null
  }
}

export async function getCmsPagePreview(
  slug: string,
  token: string
): Promise<CmsPageWithLayout | null> {
  try {
    // Encode the slug for URL safety (especially for "/" homepage)
    const encodedSlug = encodeURIComponent(slug)
    const res = await fetch(
      `${BACKEND_URL}/store/cms-pages/${encodedSlug}/preview?token=${encodeURIComponent(token)}`,
      {
        headers: {
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        cache: "no-store",
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    if (!data.page) return null
    return { page: data.page, layout: data.layout ?? null }
  } catch {
    return null
  }
}

// --- Admin API ---

async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  })
}

export async function listCmsPages(): Promise<{
  pages: CmsPage[]
  count: number
}> {
  const res = await adminFetch("/admin/cms-pages", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch pages")
  return res.json()
}

export async function getCmsPageById(id: string): Promise<CmsPage> {
  const res = await adminFetch(`/admin/cms-pages/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch page")
  const data = await res.json()
  return data.page
}

export async function createCmsPage(body: {
  slug: string
  title: string
  content?: Record<string, unknown>
  seo_meta_title?: string
  seo_meta_description?: string
  seo_og_image_url?: string
}): Promise<CmsPage> {
  const res = await adminFetch("/admin/cms-pages", {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to create page")
  }
  const data = await res.json()
  return data.page
}

export async function updateCmsPage(
  id: string,
  body: {
    slug?: string
    title?: string
    content?: Record<string, unknown>
    seo_meta_title?: string | null
    seo_meta_description?: string | null
    seo_og_image_url?: string | null
  }
): Promise<CmsPage> {
  const res = await adminFetch(`/admin/cms-pages/${id}`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to update page")
  }
  const data = await res.json()
  return data.page
}

export async function publishCmsPage(id: string): Promise<CmsPage> {
  const res = await adminFetch(`/admin/cms-pages/${id}/publish`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to publish page")
  const data = await res.json()
  return data.page
}

export async function unpublishCmsPage(id: string): Promise<CmsPage> {
  const res = await adminFetch(`/admin/cms-pages/${id}/unpublish`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to unpublish page")
  const data = await res.json()
  return data.page
}

export async function deleteCmsPage(id: string): Promise<void> {
  const res = await adminFetch(`/admin/cms-pages/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete page")
}

// --- Theme Settings ---

export type ThemeSettings = {
  id: string
  store_id: string | null
  store_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  text_muted_color: string
  heading_font: string
  body_font: string
  header_variant: string
  footer_variant: string
  product_template_variant: "classique" | "galerie" | "immersif"
  header_bg_color: string
  header_text_color: string
  footer_bg_color: string
  footer_text_color: string
  button_bg_color: string
  button_text_color: string
  button_border_radius: string
  instagram_url: string | null
  facebook_url: string | null
  linkedin_url: string | null
  tiktok_url: string | null
  pinterest_url: string | null
  google_business_url: string | null
  show_out_of_stock: boolean
  enable_back_in_stock_alerts: boolean
  show_product_recommendations: boolean
  show_new_tag: boolean
  show_low_stock: boolean
  low_stock_threshold: number
  offer_gift_wrapping: boolean
}

export async function getThemeSettings(): Promise<ThemeSettings | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/theme-settings`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      cache: "no-store", // Désactivé temporairement pour voir les changements immédiatement
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.settings ?? null
  } catch {
    return null
  }
}
