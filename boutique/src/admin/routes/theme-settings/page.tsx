import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import { Container, Heading, Text, Button, Label, Input, Select, Tabs, Switch } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { sdk } from "../../lib/client"

type ThemeSettings = {
  id: string
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
  product_template_variant: string
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
  figma_access_token: string | null
}

const ColorInput = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) => (
  <div className="flex flex-col gap-1">
    <Label size="small">{label}</Label>
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-8 rounded border border-ui-border-base cursor-pointer"
      />
      <Input
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 font-mono text-xs"
      />
    </div>
  </div>
)

const VariantSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}) => (
  <div className="flex flex-col gap-1">
    <Label size="small">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder="Select variant" />
      </Select.Trigger>
      <Select.Content>
        {options.map((opt) => (
          <Select.Item key={opt.value} value={opt.value}>
            {opt.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  </div>
)

const ToggleRow = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <Label size="small">{label}</Label>
      {description && (
        <Text size="small" className="text-ui-fg-subtle">
          {description}
        </Text>
      )}
    </div>
    <Switch size="small" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
)

const ThemeSettingsPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<ThemeSettings>>({})
  const [success, setSuccess] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["theme-settings"],
    queryFn: () =>
      sdk.client.fetch<{ settings: ThemeSettings }>("/admin/theme-settings"),
  })

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (body: Partial<ThemeSettings>) =>
      sdk.client.fetch<{ settings: ThemeSettings }>("/admin/theme-settings", {
        method: "POST",
        body,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(["theme-settings"], result)
      setSuccess("Settings saved!")
      setTimeout(() => setSuccess(""), 2000)
    },
  })

  const handleSave = () => {
    const payload = {
      store_name: form.store_name,
      logo_url: form.logo_url,
      favicon_url: form.favicon_url,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      accent_color: form.accent_color,
      background_color: form.background_color,
      text_color: form.text_color,
      text_muted_color: form.text_muted_color,
      heading_font: form.heading_font,
      body_font: form.body_font,
      product_template_variant: form.product_template_variant,
      button_bg_color: form.button_bg_color,
      button_text_color: form.button_text_color,
      button_border_radius: form.button_border_radius,
      instagram_url: form.instagram_url,
      facebook_url: form.facebook_url,
      linkedin_url: form.linkedin_url,
      tiktok_url: form.tiktok_url,
      pinterest_url: form.pinterest_url,
      google_business_url: form.google_business_url,
      show_out_of_stock: form.show_out_of_stock,
      enable_back_in_stock_alerts: form.enable_back_in_stock_alerts,
      show_product_recommendations: form.show_product_recommendations,
      show_new_tag: form.show_new_tag,
      show_low_stock: form.show_low_stock,
      low_stock_threshold: form.low_stock_threshold,
      offer_gift_wrapping: form.offer_gift_wrapping,
      figma_access_token: form.figma_access_token,
    }
    saveMutation.mutate(payload)
  }

  const updateField = (key: keyof ThemeSettings, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Loading settings...</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Theme Settings</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Customize your storefront appearance
          </Text>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <Text size="small" className="text-ui-fg-interactive">
              {success}
            </Text>
          )}
          <Button
            size="small"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="px-6 py-4">
        <Tabs defaultValue="general-site">
          <Tabs.List>
            <Tabs.Trigger value="general-site">Parametres generaux du site</Tabs.Trigger>
            <Tabs.Trigger value="general-store">Parametres generaux de la boutique</Tabs.Trigger>
          </Tabs.List>

          {/* Tab 1 - Site Settings */}
          <Tabs.Content value="general-site">
            <div className="divide-y">
              {/* Branding */}
              <div className="py-6">
                <Text size="base" weight="plus" className="mb-4">
                  Branding
                </Text>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label size="small">Store Name</Label>
                    <Input
                      size="small"
                      value={form.store_name || ""}
                      onChange={(e) => updateField("store_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label size="small">Logo URL</Label>
                    <Input
                      size="small"
                      value={form.logo_url || ""}
                      onChange={(e) => updateField("logo_url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Main Colors */}
              <div className="py-6">
                <Text size="base" weight="plus" className="mb-4">
                  Couleurs principales
                </Text>
                <div className="grid grid-cols-3 gap-4">
                  <ColorInput
                    label="Primary"
                    value={form.primary_color || "#000000"}
                    onChange={(v) => updateField("primary_color", v)}
                  />
                  <ColorInput
                    label="Secondary"
                    value={form.secondary_color || "#ffffff"}
                    onChange={(v) => updateField("secondary_color", v)}
                  />
                </div>
              </div>

              {/* Social Media */}
              <div className="py-6">
                <Text size="base" weight="plus" className="mb-4">
                  Reseaux sociaux
                </Text>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label size="small">Instagram</Label>
                    <Input
                      size="small"
                      value={form.instagram_url || ""}
                      onChange={(e) => updateField("instagram_url", e.target.value)}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <Label size="small">Facebook</Label>
                    <Input
                      size="small"
                      value={form.facebook_url || ""}
                      onChange={(e) => updateField("facebook_url", e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <Label size="small">LinkedIn</Label>
                    <Input
                      size="small"
                      value={form.linkedin_url || ""}
                      onChange={(e) => updateField("linkedin_url", e.target.value)}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                  <div>
                    <Label size="small">TikTok</Label>
                    <Input
                      size="small"
                      value={form.tiktok_url || ""}
                      onChange={(e) => updateField("tiktok_url", e.target.value)}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                  <div>
                    <Label size="small">Pinterest</Label>
                    <Input
                      size="small"
                      value={form.pinterest_url || ""}
                      onChange={(e) => updateField("pinterest_url", e.target.value)}
                      placeholder="https://pinterest.com/..."
                    />
                  </div>
                  <div>
                    <Label size="small">Google Business</Label>
                    <Input
                      size="small"
                      value={form.google_business_url || ""}
                      onChange={(e) => updateField("google_business_url", e.target.value)}
                      placeholder="https://business.google.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Product Page Template */}
              <div className="py-6">
                <Text size="base" weight="plus" className="mb-4">
                  Page Produit
                </Text>
                <div className="grid grid-cols-1 gap-4">
                  <VariantSelect
                    label="Template de page produit"
                    value={form.product_template_variant || "classique"}
                    onChange={(v) => updateField("product_template_variant", v)}
                    options={[
                      { label: "Classique (Image gauche, infos droite)", value: "classique" },
                      { label: "Galerie (Grande galerie, infos en dessous)", value: "galerie" },
                      { label: "Immersif (Pleine largeur, design moderne)", value: "immersif" },
                    ]}
                  />
                  <Text size="small" className="text-ui-fg-muted">
                    Choisissez le design de vos pages produit. Chaque template offre une mise en page differente pour mettre en valeur vos produits.
                  </Text>
                </div>
              </div>

              {/* Typography */}
              <div className="py-6">
                <Text size="base" weight="plus" className="mb-4">
                  Typography
                </Text>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label size="small">Heading Font</Label>
                    <Input
                      size="small"
                      value={form.heading_font || "Inter"}
                      onChange={(e) => updateField("heading_font", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label size="small">Body Font</Label>
                    <Input
                      size="small"
                      value={form.body_font || "Inter"}
                      onChange={(e) => updateField("body_font", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Integrations */}
              <div className="py-6">
                <Text size="base" weight="plus" className="mb-4">
                  Integrations
                </Text>
                <div className="grid grid-cols-1 gap-4" style={{ maxWidth: 480 }}>
                  <div>
                    <Label size="small">Figma Access Token</Label>
                    <Input
                      size="small"
                      type="password"
                      value={form.figma_access_token || ""}
                      onChange={(e) => updateField("figma_access_token", e.target.value || null)}
                      placeholder="figd_xxxxxxxxxxxxxxxx"
                    />
                    <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 4 }}>
                      Figma &gt; Settings &gt; Personal access tokens. Necessaire pour l'import Figma dans l'editeur CMS.
                    </Text>
                  </div>
                </div>
              </div>

            </div>
          </Tabs.Content>

          {/* Tab 2 - Store Settings */}
          <Tabs.Content value="general-store">
            <div className="divide-y">
              <ToggleRow
                label="Afficher les produits hors stock"
                checked={form.show_out_of_stock || false}
                onCheckedChange={(v) => {
                  updateField("show_out_of_stock", v)
                  if (!v) {
                    updateField("enable_back_in_stock_alerts", false)
                  }
                }}
              />
              <ToggleRow
                label="Proposer les alertes retour en stock"
                checked={form.enable_back_in_stock_alerts || false}
                onCheckedChange={(v) => updateField("enable_back_in_stock_alerts", v)}
                disabled={!form.show_out_of_stock}
              />
              <ToggleRow
                label="Afficher les recommandations sous les fiches produits"
                description="Affiche les produits de la meme categorie"
                checked={form.show_product_recommendations ?? true}
                onCheckedChange={(v) => updateField("show_product_recommendations", v)}
              />
              <ToggleRow
                label="Afficher le tag Nouveau"
                description="Pour les produits de moins de 7 jours"
                checked={form.show_new_tag ?? true}
                onCheckedChange={(v) => updateField("show_new_tag", v)}
              />
              <div>
                <ToggleRow
                  label="Afficher Stock faible"
                  checked={form.show_low_stock || false}
                  onCheckedChange={(v) => updateField("show_low_stock", v)}
                />
                {form.show_low_stock && (
                  <div className="pb-3 pl-1">
                    <Label size="small">Seuil</Label>
                    <Input
                      size="small"
                      type="number"
                      min={1}
                      value={form.low_stock_threshold ?? 5}
                      onChange={(e) => updateField("low_stock_threshold", parseInt(e.target.value) || 5)}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
              <ToggleRow
                label="Proposer les paquets cadeaux"
                description="Ajoute une option paquet cadeau lors de la commande"
                checked={form.offer_gift_wrapping || false}
                onCheckedChange={(v) => updateField("offer_gift_wrapping", v)}
              />
            </div>
          </Tabs.Content>
        </Tabs>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Theme Settings",
  icon: Swatch,
})

export default ThemeSettingsPage
