import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowUpRightOnBox } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Label,
  Input,
  Tabs,
  Badge,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type UrlRedirect = {
  id: string
  source_url: string
  target_type: "homepage" | "cms_page" | "product_category" | "product"
  target_id: string | null
  target_label: string | null
  status_code: number
  created_at: string
}

type CmsPage = {
  id: string
  title: string
  slug: string
  status: string
}

type ProductCategory = {
  id: string
  name: string
  handle: string
}

type Product = {
  id: string
  title: string
  handle: string
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  homepage: "Page d'accueil",
  cms_page: "Page CMS",
  product_category: "Categorie",
  product: "Produit",
}

const TARGET_TYPE_COLORS: Record<string, "green" | "blue" | "orange" | "purple"> = {
  homepage: "green",
  cms_page: "blue",
  product_category: "orange",
  product: "purple",
}

// --- Destination Picker Modal ---

const DestinationPicker = ({
  sourceUrl,
  onSelect,
  onClose,
}: {
  sourceUrl: string
  onSelect: (type: string, id: string | null, label: string) => void
  onClose: () => void
}) => {
  const [search, setSearch] = useState("")

  const { data: cmsData } = useQuery({
    queryKey: ["cms-pages-list"],
    queryFn: () =>
      sdk.client.fetch<{ pages: CmsPage[] }>("/admin/cms-pages"),
  })

  const { data: catData } = useQuery({
    queryKey: ["product-categories-list"],
    queryFn: () =>
      sdk.client.fetch<{ product_categories: ProductCategory[] }>(
        "/admin/product-categories"
      ),
  })

  const { data: prodData } = useQuery({
    queryKey: ["products-list"],
    queryFn: () =>
      sdk.client.fetch<{ products: Product[] }>("/admin/products?limit=100"),
  })

  const pages = cmsData?.pages ?? []
  const categories = catData?.product_categories ?? []
  const products = prodData?.products ?? []

  const filterBySearch = (text: string) =>
    !search || text.toLowerCase().includes(search.toLowerCase())

  const ItemButton = ({
    onClick,
    title,
    subtitle,
    active,
  }: {
    onClick: () => void
    title: string
    subtitle: string
    active?: boolean
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
        active
          ? "bg-ui-bg-interactive text-ui-fg-on-color"
          : "hover:bg-ui-bg-base-hover"
      }`}
      style={{ display: "block", border: "none", background: active ? undefined : "none", cursor: "pointer" }}
    >
      <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
      <div
        style={{
          fontSize: 11,
          opacity: 0.6,
          fontFamily: "monospace",
          marginTop: 1,
        }}
      >
        {subtitle}
      </div>
    </button>
  )

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: "var(--bg-base, #fff)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 560,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px 16px" }}>
          <Text size="xsmall" className="text-ui-fg-muted">
            Rediriger
          </Text>
          <Text size="small" weight="plus" className="font-mono" style={{ marginTop: 2 }}>
            {sourceUrl}
          </Text>
          <div style={{ marginTop: 12 }}>
            <Input
              size="small"
              placeholder="Rechercher une destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            borderTop: "1px solid var(--border-base, #e5e7eb)",
          }}
        >
          <Tabs defaultValue="cms">
            <div style={{ padding: "8px 24px 0" }}>
              <Tabs.List>
                <Tabs.Trigger value="cms">
                  Pages CMS ({pages.length + 1})
                </Tabs.Trigger>
                <Tabs.Trigger value="category">
                  Categories ({categories.length})
                </Tabs.Trigger>
                <Tabs.Trigger value="product">
                  Produits ({products.length})
                </Tabs.Trigger>
              </Tabs.List>
            </div>

            <Tabs.Content value="cms">
              <div
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  padding: "8px 20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <ItemButton
                  onClick={() => onSelect("homepage", null, "Page d'accueil")}
                  title="Page d'accueil"
                  subtitle="/"
                />
                {pages
                  .filter(
                    (p) => filterBySearch(p.title) || filterBySearch(p.slug)
                  )
                  .map((p) => (
                    <ItemButton
                      key={p.id}
                      onClick={() => onSelect("cms_page", p.id, p.title)}
                      title={p.title}
                      subtitle={`/${p.slug}`}
                    />
                  ))}
              </div>
            </Tabs.Content>

            <Tabs.Content value="category">
              <div
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  padding: "8px 20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {categories.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <Text size="small" className="text-ui-fg-muted">
                      Aucune categorie trouvee
                    </Text>
                  </div>
                ) : (
                  categories
                    .filter((c) => filterBySearch(c.name))
                    .map((c) => (
                      <ItemButton
                        key={c.id}
                        onClick={() =>
                          onSelect("product_category", c.id, c.name)
                        }
                        title={c.name}
                        subtitle={`/categories/${c.handle}`}
                      />
                    ))
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="product">
              <div
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  padding: "8px 20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {products.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <Text size="small" className="text-ui-fg-muted">
                      Aucun produit trouve
                    </Text>
                  </div>
                ) : (
                  products
                    .filter((p) => filterBySearch(p.title))
                    .map((p) => (
                      <ItemButton
                        key={p.id}
                        onClick={() => onSelect("product", p.id, p.title)}
                        title={p.title}
                        subtitle={`/products/${p.handle}`}
                      />
                    ))
                )}
              </div>
            </Tabs.Content>
          </Tabs>
        </div>

        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--border-base, #e5e7eb)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button size="small" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---

const UrlRedirectsPage = () => {
  const queryClient = useQueryClient()
  const [bulkUrls, setBulkUrls] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [editingRedirect, setEditingRedirect] = useState<UrlRedirect | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["url-redirects"],
    queryFn: () =>
      sdk.client.fetch<{ redirects: UrlRedirect[]; count: number }>(
        "/admin/url-redirects"
      ),
  })

  const bulkMutation = useMutation({
    mutationFn: (body: { urls: string[] }) =>
      sdk.client.fetch("/admin/url-redirects/bulk", {
        method: "POST",
        body: { ...body, target_type: "homepage" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["url-redirects"] })
      setBulkUrls("")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      target_type: string
      target_id: string | null
      target_label: string | null
    }) =>
      sdk.client.fetch(`/admin/url-redirects/${id}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["url-redirects"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/url-redirects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["url-redirects"] })
    },
  })

  const handleBulkAdd = () => {
    const urls = bulkUrls
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
    if (urls.length === 0) return
    bulkMutation.mutate({ urls })
  }

  const handleDestinationSelect = (
    type: string,
    id: string | null,
    label: string
  ) => {
    if (editingRedirect) {
      updateMutation.mutate({
        id: editingRedirect.id,
        target_type: type,
        target_id: id,
        target_label: label,
      })
    }
    setShowPicker(false)
    setEditingRedirect(null)
  }

  const redirects = data?.redirects ?? []

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Redirections URL</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Gerez les redirections 301 pour la migration de votre site
          </Text>
        </div>
        {redirects.length > 0 && (
          <Badge color="grey" size="small">
            {redirects.length} redirection{redirects.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Bulk add */}
      <div className="px-6 py-5">
        <Label size="small" className="mb-1.5 block">
          Ajouter des URLs a rediriger
        </Label>
        <Text size="xsmall" className="text-ui-fg-muted mb-2">
          Collez plusieurs URLs separees par une virgule. Chaque URL sera creee
          avec une redirection vers la page d'accueil par defaut.
        </Text>
        <div className="flex gap-3 items-end">
          <textarea
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            placeholder="/ancienne-page, /old-about, /ancien-produit-123, /blog/mon-article"
            rows={3}
            className="flex-1 rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-ui-border-interactive focus:shadow-borders-interactive-with-active transition-colors"
          />
          <Button
            size="small"
            onClick={handleBulkAdd}
            isLoading={bulkMutation.isPending}
            disabled={bulkMutation.isPending || !bulkUrls.trim()}
          >
            Ajouter
          </Button>
        </div>
        {bulkMutation.isError && (
          <Text size="small" className="text-ui-fg-error mt-2">
            {(bulkMutation.error as Error).message}
          </Text>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="px-6 py-12 text-center">
          <Text size="small" className="text-ui-fg-subtle">
            Chargement...
          </Text>
        </div>
      ) : redirects.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Text size="base" className="text-ui-fg-muted mb-1">
            Aucune redirection
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Collez des URLs ci-dessus pour commencer a configurer vos redirections.
          </Text>
        </div>
      ) : (
        <div>
          {/* Table header */}
          <div
            className="grid gap-4 px-6 py-2.5"
            style={{ gridTemplateColumns: "1fr 1fr auto auto" }}
          >
            <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wide">
              URL source
            </Text>
            <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wide">
              Destination
            </Text>
            <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wide text-center" style={{ width: 50 }}>
              Code
            </Text>
            <div style={{ width: 90 }} />
          </div>

          {/* Rows */}
          <div className="divide-y">
            {redirects.map((r) => (
              <div
                key={r.id}
                className="grid gap-4 px-6 py-3 items-center hover:bg-ui-bg-base-hover transition-colors"
                style={{ gridTemplateColumns: "1fr 1fr auto auto" }}
              >
                {/* Source URL */}
                <div className="min-w-0">
                  <Text
                    size="small"
                    className="font-mono break-all"
                    style={{ color: "var(--fg-base)" }}
                  >
                    {r.source_url}
                  </Text>
                </div>

                {/* Destination */}
                <div className="min-w-0">
                  <button
                    onClick={() => {
                      setEditingRedirect(r)
                      setShowPicker(true)
                    }}
                    className="text-left rounded-lg border border-dashed border-ui-border-base hover:border-ui-border-interactive hover:bg-ui-bg-subtle-hover px-3 py-2 w-full transition-colors group"
                    style={{ background: "none", cursor: "pointer" }}
                  >
                    <div className="flex items-center gap-2">
                      <Text size="small" weight="plus" className="truncate">
                        {r.target_label || TARGET_TYPE_LABELS[r.target_type]}
                      </Text>
                      <span className="text-ui-fg-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        modifier
                      </span>
                    </div>
                    <Badge
                      size="2xsmall"
                      color={TARGET_TYPE_COLORS[r.target_type]}
                      className="mt-1"
                    >
                      {TARGET_TYPE_LABELS[r.target_type]}
                    </Badge>
                  </button>
                </div>

                {/* Status code */}
                <div style={{ width: 50, textAlign: "center" }}>
                  <Badge size="2xsmall" color="grey">
                    {r.status_code}
                  </Badge>
                </div>

                {/* Actions */}
                <div style={{ width: 90, textAlign: "right" }}>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => {
                      if (confirm("Supprimer cette redirection ?")) {
                        deleteMutation.mutate(r.id)
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPicker && editingRedirect && (
        <DestinationPicker
          sourceUrl={editingRedirect.source_url}
          onSelect={handleDestinationSelect}
          onClose={() => {
            setShowPicker(false)
            setEditingRedirect(null)
          }}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Redirections",
  icon: ArrowUpRightOnBox,
})

export default UrlRedirectsPage
