import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import { Container, Heading, Text, Button, Label, Input, Select } from "@medusajs/ui"
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
  header_variant: string
  footer_variant: string
  header_bg_color: string
  header_text_color: string
  footer_bg_color: string
  footer_text_color: string
  button_bg_color: string
  button_text_color: string
  button_border_radius: string
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
    // Only send editable fields, exclude id, created_at, updated_at, deleted_at
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
      header_variant: form.header_variant,
      footer_variant: form.footer_variant,
      header_bg_color: form.header_bg_color,
      header_text_color: form.header_text_color,
      footer_bg_color: form.footer_bg_color,
      footer_text_color: form.footer_text_color,
      button_bg_color: form.button_bg_color,
      button_text_color: form.button_text_color,
      button_border_radius: form.button_border_radius,
    }
    saveMutation.mutate(payload)
  }

  const updateField = (key: keyof ThemeSettings, value: string) => {
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

      {/* Branding */}
      <div className="px-6 py-6">
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
      <div className="px-6 py-6">
        <Text size="base" weight="plus" className="mb-4">
          Main Colors
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
          <ColorInput
            label="Accent"
            value={form.accent_color || "#3b82f6"}
            onChange={(v) => updateField("accent_color", v)}
          />
          <ColorInput
            label="Background"
            value={form.background_color || "#ffffff"}
            onChange={(v) => updateField("background_color", v)}
          />
          <ColorInput
            label="Text"
            value={form.text_color || "#111827"}
            onChange={(v) => updateField("text_color", v)}
          />
          <ColorInput
            label="Muted Text"
            value={form.text_muted_color || "#6b7280"}
            onChange={(v) => updateField("text_muted_color", v)}
          />
        </div>
      </div>

      {/* Header & Footer */}
      <div className="px-6 py-6">
        <Text size="base" weight="plus" className="mb-4">
          Header & Footer
        </Text>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <VariantSelect
            label="Header Design"
            value={form.header_variant || "one"}
            onChange={(v) => updateField("header_variant", v)}
            options={[
              { label: "Standard (Logo Left)", value: "one" },
              { label: "Centered (Logo Center)", value: "two" },
            ]}
          />
          <VariantSelect
            label="Footer Design"
            value={form.footer_variant || "one"}
            onChange={(v) => updateField("footer_variant", v)}
            options={[
              { label: "Simple (Minimal)", value: "one" },
              { label: "Expanded (Links & Newsletter)", value: "two" },
            ]}
          />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <ColorInput
            label="Header Background"
            value={form.header_bg_color || "#ffffff"}
            onChange={(v) => updateField("header_bg_color", v)}
          />
          <ColorInput
            label="Header Text"
            value={form.header_text_color || "#111827"}
            onChange={(v) => updateField("header_text_color", v)}
          />
          <ColorInput
            label="Footer Background"
            value={form.footer_bg_color || "#111827"}
            onChange={(v) => updateField("footer_bg_color", v)}
          />
          <ColorInput
            label="Footer Text"
            value={form.footer_text_color || "#ffffff"}
            onChange={(v) => updateField("footer_text_color", v)}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="px-6 py-6">
        <Text size="base" weight="plus" className="mb-4">
          Buttons
        </Text>
        <div className="grid grid-cols-3 gap-4">
          <ColorInput
            label="Button Background"
            value={form.button_bg_color || "#000000"}
            onChange={(v) => updateField("button_bg_color", v)}
          />
          <ColorInput
            label="Button Text"
            value={form.button_text_color || "#ffffff"}
            onChange={(v) => updateField("button_text_color", v)}
          />
          <div>
            <Label size="small">Border Radius</Label>
            <Input
              size="small"
              value={form.button_border_radius || "4px"}
              onChange={(e) => updateField("button_border_radius", e.target.value)}
              placeholder="4px"
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="px-6 py-6">
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

      {/* Preview */}
      <div className="px-6 py-6">
        <Text size="base" weight="plus" className="mb-4">
          Preview
        </Text>
        <div
          className="rounded-lg overflow-hidden border"
          style={{ background: form.background_color }}
        >
          <div
            style={{
              background: form.header_bg_color,
              color: form.header_text_color,
              padding: "16px 24px",
              fontFamily: form.heading_font,
            }}
          >
            <strong>{form.store_name || "My Store"}</strong>
          </div>
          <div style={{ padding: 24, color: form.text_color, fontFamily: form.body_font }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
              Sample Heading
            </h2>
            <p style={{ color: form.text_muted_color, marginBottom: 16 }}>
              This is how your text will look on the storefront.
            </p>
            <button
              style={{
                background: form.button_bg_color,
                color: form.button_text_color,
                borderRadius: form.button_border_radius,
                padding: "8px 24px",
                border: "none",
                fontWeight: 600,
              }}
            >
              Sample Button
            </button>
          </div>
          <div
            style={{
              background: form.footer_bg_color,
              color: form.footer_text_color,
              padding: "16px 24px",
              fontSize: 14,
            }}
          >
            Footer content
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Theme Settings",
  icon: Swatch,
})

export default ThemeSettingsPage
