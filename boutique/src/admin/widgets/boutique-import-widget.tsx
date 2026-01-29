import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Text,
  FocusModal,
  toast,
  Badge,
  clx,
} from "@medusajs/ui"
import { ArrowUpTray, DocumentText, XMark } from "@medusajs/icons"
import { useState, useCallback, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"

interface ImportResponse {
  success: boolean
  import_id: string | null
  status: "pending_confirmation" | "confirmed" | "failed"
  created_products_count_estimate: number
  warnings: string[]
  message?: string
}

const BoutiqueImportWidget = () => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const importMutation = useMutation({
    mutationFn: async (file: File): Promise<ImportResponse> => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(
        "/admin/custom/product-import/transform-and-import",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      )

      const data = await response.json()

      // Store the result even if it failed (to show warnings)
      setImportResult(data)

      if (!response.ok || !data.success) {
        const errorMsg = data.message || "Import échoué"
        setImportError(errorMsg)
        throw new Error(errorMsg)
      }

      setImportError(null)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })

      toast.success(
        `Import réussi ! ${data.created_products_count_estimate} produit(s) importé(s).`
      )

      if (data.warnings && data.warnings.length > 0) {
        console.warn("Import warnings:", data.warnings)
        toast.warning(`${data.warnings.length} warning(s) pendant l'import`)
      }

      // Don't close modal immediately - let user see warnings
      setTimeout(() => {
        setOpen(false)
        setFile(null)
        setImportResult(null)
      }, 2000)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'import")
      // Don't close modal - show error details
    },
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile.type === "text/csv" ||
        droppedFile.name.endsWith(".csv")
      ) {
        setFile(droppedFile)
      } else {
        toast.error("Seuls les fichiers CSV sont acceptés")
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier CSV")
      return
    }
    importMutation.mutate(file)
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">Import Boutique</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Importez vos produits depuis un export CSV legacy (boutique-export.csv)
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
          <ArrowUpTray />
          Import Boutique
        </Button>
      </div>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={importMutation.isPending}
                  >
                    Annuler
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={handleSubmit}
                  disabled={!file || importMutation.isPending}
                  isLoading={importMutation.isPending}
                >
                  Importer
                </Button>
              </div>
            </FocusModal.Header>

            <FocusModal.Body className="flex flex-1 flex-col items-center overflow-auto p-16">
              <div className="flex w-full max-w-lg flex-col gap-y-8">
                <div className="flex flex-col gap-y-1">
                  <Heading>Import CSV Boutique</Heading>
                  <Text className="text-ui-fg-subtle">
                    Déposez votre fichier boutique-export.csv. Il sera
                    automatiquement transformé au format Medusa et importé.
                  </Text>
                </div>

                {/* Drop zone */}
                <div
                  className={clx(
                    "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
                    dragActive
                      ? "border-ui-fg-interactive bg-ui-bg-interactive"
                      : "border-ui-border-strong bg-ui-bg-subtle",
                    "cursor-pointer hover:border-ui-fg-interactive hover:bg-ui-bg-subtle-hover"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <ArrowUpTray className="text-ui-fg-subtle mb-4 h-8 w-8" />
                  <Text weight="plus" className="mb-1">
                    Import Produits
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    Glissez-déposez un fichier CSV ou cliquez pour parcourir
                  </Text>
                </div>

                {/* Selected file display */}
                {file && (
                  <div className="flex items-center justify-between rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
                    <div className="flex items-center gap-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ui-bg-subtle">
                        <DocumentText className="text-ui-fg-subtle" />
                      </div>
                      <div className="flex flex-col">
                        <Text size="small" weight="plus">
                          {file.name}
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {(file.size / 1024).toFixed(1)} KB
                        </Text>
                      </div>
                    </div>
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile()
                      }}
                      disabled={importMutation.isPending}
                    >
                      <XMark />
                    </Button>
                  </div>
                )}

                {/* Info box */}
                <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                  <Text size="small" weight="plus" className="mb-2">
                    Format attendu (boutique-export.csv)
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    Colonnes: images, catégorie, nom du produit, description,
                    référence, TVA, variations, prix, stock, poids, ancienne url
                  </Text>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge color="blue" size="small">
                      Séparateur: ;
                    </Badge>
                    <Badge color="blue" size="small">
                      Encodage: UTF-8
                    </Badge>
                    <Badge color="green" size="small">
                      Transformation auto
                    </Badge>
                  </div>
                </div>

                {/* Error display */}
                {importError && (
                  <div className="rounded-lg border border-ui-border-error bg-ui-bg-subtle-error p-4">
                    <Text size="small" weight="plus" className="mb-2 text-ui-fg-error">
                      Erreur
                    </Text>
                    <Text size="small" className="text-ui-fg-error">
                      {importError}
                    </Text>
                  </div>
                )}

                {/* Warnings display - show from importResult (works for both success and error) */}
                {importResult?.warnings && importResult.warnings.length > 0 && (
                  <div className={clx(
                    "rounded-lg border p-4",
                    importResult.success
                      ? "border-ui-border-warning bg-ui-bg-subtle-warning"
                      : "border-ui-border-error bg-ui-bg-subtle-error"
                  )}>
                    <Text size="small" weight="plus" className="mb-2">
                      {importResult.success ? "Warnings" : "Détails"} ({importResult.warnings.length})
                    </Text>
                    <div className="max-h-60 overflow-auto space-y-1">
                      {importResult.warnings.slice(0, 20).map((w, i) => (
                        <Text
                          key={i}
                          size="small"
                          className="text-ui-fg-subtle"
                        >
                          • {w}
                        </Text>
                      ))}
                      {importResult.warnings.length > 20 && (
                        <Text size="small" className="text-ui-fg-muted mt-2">
                          ... et {importResult.warnings.length - 20} autres (voir console)
                        </Text>
                      )}
                    </div>
                  </div>
                )}

                {/* Success message */}
                {importResult?.success && (
                  <div className="rounded-lg border border-ui-border-success bg-ui-bg-subtle-success p-4">
                    <Text size="small" weight="plus" className="text-ui-fg-success">
                      Import réussi ! {importResult.created_products_count_estimate} produit(s) importé(s).
                    </Text>
                  </div>
                )}
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default BoutiqueImportWidget
