import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  DocumentText,
  House,
  DotsSix,
  PencilSquare,
  Trash,
  Plus,
  ChevronRight,
  FolderOpen,
  Folder,
  Globe,
} from "@medusajs/icons"
import { Container, Heading, Text, Button, Label, Input, Switch, toast, IconButton } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useState, useCallback, useRef, useMemo } from "react"
import { sdk } from "../../lib/client"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// --- Types ---

type CmsPage = {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  seo_meta_title: string | null
  seo_meta_description: string | null
  noindex: boolean
  updated_at: string
  is_system: boolean
  parent_id: string | null
  position: number
  children_count: number
}

type TreeNode = CmsPage & { children: CmsPage[] }

// --- Helpers ---

function buildTree(pages: CmsPage[]): TreeNode[] {
  const rootPages = pages
    .filter((p) => !p.parent_id)
    .sort((a, b) => a.position - b.position)

  return rootPages.map((root) => ({
    ...root,
    children: pages
      .filter((p) => p.parent_id === root.id)
      .sort((a, b) => a.position - b.position),
  }))
}

function flattenTreeForReorder(tree: TreeNode[]): Array<{ id: string; parent_id: string | null; position: number }> {
  const items: Array<{ id: string; parent_id: string | null; position: number }> = []
  tree.forEach((node, i) => {
    items.push({ id: node.id, parent_id: null, position: i })
    node.children.forEach((child, j) => {
      items.push({ id: child.id, parent_id: node.id, position: j })
    })
  })
  return items
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

// --- Status Badge ---

const StatusBadge = ({ status }: { status: "draft" | "published" }) => (
  <span
    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
    style={
      status === "published"
        ? { background: "rgba(16, 185, 129, 0.1)", color: "#059669" }
        : { background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }
    }
  >
    <span
      className="rounded-full"
      style={{
        width: 6,
        height: 6,
        background: status === "published" ? "#10b981" : "#f59e0b",
      }}
    />
    {status === "published" ? "Publie" : "Brouillon"}
  </span>
)

// --- Edit Modal ---

const EditPageModal = ({
  page,
  onClose,
}: {
  page: CmsPage
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState(page.slug)
  const [title, setTitle] = useState(page.title)
  const [seoTitle, setSeoTitle] = useState(page.seo_meta_title || "")
  const [seoDescription, setSeoDescription] = useState(page.seo_meta_description || "")
  const [noindex, setNoindex] = useState(page.noindex ?? false)

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch<{ page: CmsPage }>(`/admin/cms-pages/${page.id}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      ...(page.is_system ? {} : { slug }),
      title,
      seo_meta_title: seoTitle || null,
      seo_meta_description: seoDescription || null,
      noindex,
    })
  }

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
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: "var(--bg-base, #fff)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.18)",
          border: "1px solid var(--border-base, #e5e7eb)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-base, #e5e7eb)",
            }}
          >
            <Heading level="h2">Modifier la page</Heading>
            <Text size="xsmall" className="text-ui-fg-muted mt-1">
              Modifiez les informations et le SEO de cette page.
            </Text>
          </div>

          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <Label size="small">Titre</Label>
              <Input
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {!page.is_system && (
              <div>
                <Label size="small">Slug</Label>
                <Input
                  size="small"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  required
                />
                <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 4 }}>
                  URL : /{slug}
                </Text>
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid var(--border-base, #e5e7eb)",
                paddingTop: 16,
              }}
            >
              <Text size="small" weight="plus" className="mb-3">
                SEO
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <Label size="small">Balise Title</Label>
                  <Input
                    size="small"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Titre pour les moteurs de recherche"
                  />
                  <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                    {seoTitle.length}/60 caracteres
                  </Text>
                </div>
                <div>
                  <Label size="small">Meta Description</Label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Description pour les moteurs de recherche"
                    rows={3}
                    className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm resize-none"
                  />
                  <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 2 }}>
                    {seoDescription.length}/160 caracteres
                  </Text>
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
                <div>
                  <Label size="small">Ne pas indexer cette page</Label>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Ajoute la balise noindex pour les moteurs de recherche
                  </Text>
                </div>
                <Switch size="small" checked={noindex} onCheckedChange={setNoindex} />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-base, #e5e7eb)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button size="small" variant="secondary" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button
              size="small"
              type="submit"
              isLoading={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Enregistrer
            </Button>
          </div>

          {updateMutation.isError && (
            <div style={{ padding: "0 24px 16px" }}>
              <Text size="small" className="text-ui-fg-error">
                {(updateMutation.error as Error).message}
              </Text>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// --- Page Icon ---

const PageIcon = ({
  isSystem,
  isExpanded,
  hasChildren,
}: {
  isSystem?: boolean
  isExpanded?: boolean
  hasChildren?: boolean
}) => {
  if (isSystem) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          flexShrink: 0,
        }}
      >
        <House className="text-white" style={{ width: 16, height: 16 }} />
      </div>
    )
  }

  if (hasChildren) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: 32,
          height: 32,
          background: "rgba(99, 102, 241, 0.08)",
          flexShrink: 0,
        }}
      >
        {isExpanded ? (
          <FolderOpen className="text-ui-fg-muted" style={{ width: 16, height: 16 }} />
        ) : (
          <Folder className="text-ui-fg-muted" style={{ width: 16, height: 16 }} />
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        width: 32,
        height: 32,
        background: "rgba(99, 102, 241, 0.05)",
        flexShrink: 0,
      }}
    >
      <DocumentText className="text-ui-fg-muted" style={{ width: 16, height: 16 }} />
    </div>
  )
}

// --- Sortable Row ---

const SortableRow = ({
  page,
  isChild,
  isExpanded,
  hasChildren,
  childCount,
  isNestTarget,
  onToggleExpand,
  onEdit,
  onDelete,
  onNavigate,
}: {
  page: CmsPage
  isChild: boolean
  isExpanded?: boolean
  hasChildren?: boolean
  childCount?: number
  isNestTarget?: boolean
  onToggleExpand?: () => void
  onEdit: () => void
  onDelete: () => void
  onNavigate: () => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: page.is_system,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative transition-colors duration-150 ${isNestTarget
          ? "bg-blue-50 ring-2 ring-blue-400/50 ring-inset"
          : "hover:bg-ui-bg-base-hover"
        }`}
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ paddingLeft: isChild ? 56 : 16 }}
      >
        {/* Drag handle */}
        {!page.is_system ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-ui-fg-disabled hover:text-ui-fg-muted p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
            style={{ touchAction: "none", flexShrink: 0 }}
          >
            <DotsSix style={{ width: 16, height: 16 }} />
          </button>
        ) : (
          <div style={{ width: 20, flexShrink: 0 }} />
        )}

        {/* Expand/collapse for parents */}
        {!isChild && hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand?.()
            }}
            className="text-ui-fg-muted hover:text-ui-fg-base p-0.5 rounded transition-all"
            style={{ flexShrink: 0 }}
          >
            <ChevronRight
              style={{
                width: 14,
                height: 14,
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>
        ) : !isChild ? (
          <div style={{ width: 18, flexShrink: 0 }} />
        ) : null}

        {/* Page icon */}
        <PageIcon
          isSystem={page.is_system}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
        />

        {/* Page info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
          <div className="flex items-center gap-2">
            <Text size="small" weight="plus" className="truncate">
              {page.title}
            </Text>
            {hasChildren && childCount !== undefined && childCount > 0 && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-ui-bg-subtle text-ui-fg-muted"
                style={{ flexShrink: 0 }}
              >
                {childCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Globe className="text-ui-fg-disabled" style={{ width: 11, height: 11, flexShrink: 0 }} />
            <Text size="xsmall" className="text-ui-fg-subtle truncate">
              {page.is_system ? "/" : isChild ? page.slug : `/${page.slug}`}
            </Text>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Text size="xsmall" className="text-ui-fg-disabled hidden sm:block">
            {formatDate(page.updated_at)}
          </Text>

          <StatusBadge status={page.status} />

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              size="small"
              variant="transparent"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <PencilSquare style={{ width: 15, height: 15 }} />
            </IconButton>
            {!page.is_system && (
              <IconButton
                size="small"
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="hover:text-ui-fg-error"
              >
                <Trash style={{ width: 15, height: 15 }} />
              </IconButton>
            )}
          </div>
        </div>
      </div>

      {/* Tree connector lines for children */}
      {isChild && (
        <div
          className="absolute"
          style={{
            left: 52,
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--border-base, #e5e7eb)",
          }}
        />
      )}
    </div>
  )
}

// --- Homepage Row (pinned at top) ---

const HomepageRow = ({
  page,
  onEdit,
  onNavigate,
}: {
  page: CmsPage
  onEdit: () => void
  onNavigate: () => void
}) => (
  <div
    className="group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-ui-bg-base-hover"
    onClick={onNavigate}
    style={{
      borderBottom: "1px solid var(--border-base, #e5e7eb)",
      background: "linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03))",
    }}
  >
    {/* Spacer matching drag handle width */}
    <div style={{ width: 20, flexShrink: 0 }} />
    {/* Spacer matching chevron width */}
    <div style={{ width: 18, flexShrink: 0 }} />

    {/* Home icon */}
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        width: 32,
        height: 32,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        flexShrink: 0,
      }}
    >
      <House className="text-white" style={{ width: 16, height: 16 }} />
    </div>

    {/* Page info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Text size="small" weight="plus">
          Accueil
        </Text>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", flexShrink: 0 }}
        >
          HOME
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <Globe className="text-ui-fg-disabled" style={{ width: 11, height: 11, flexShrink: 0 }} />
        <Text size="xsmall" className="text-ui-fg-subtle">/</Text>
      </div>
    </div>

    {/* Right side */}
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <Text size="xsmall" className="text-ui-fg-disabled hidden sm:block">
        {formatDate(page.updated_at)}
      </Text>

      <StatusBadge status={page.status} />

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton
          size="small"
          variant="transparent"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <PencilSquare style={{ width: 15, height: 15 }} />
        </IconButton>
      </div>
    </div>
  </div>
)

// --- Main Component ---

const CmsPagesList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overParentId, setOverParentId] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const { data, isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: () =>
      sdk.client.fetch<{ pages: CmsPage[]; count: number }>(
        "/admin/cms-pages"
      ),
  })

  const createMutation = useMutation({
    mutationFn: (body: { slug: string; title: string; content: Record<string, unknown> }) =>
      sdk.client.fetch<{ page: CmsPage }>("/admin/cms-pages", {
        method: "POST",
        body,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      setShowCreate(false)
      setNewSlug("")
      setNewTitle("")
      navigate(`/cms-pages/${result.page.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/cms-pages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: Array<{ id: string; parent_id: string | null; position: number }>) =>
      sdk.client.fetch("/admin/cms-pages/reorder", {
        method: "POST",
        body: { items },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      toast.success("Ordre sauvegarde")
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] })
      toast.error("Erreur lors de la sauvegarde")
    },
  })

  const pages = data?.pages ?? []
  const tree = useMemo(() => buildTree(pages), [pages])

  // Flat list of IDs for DnD context (root pages + expanded children)
  const sortableIds = useMemo(() => {
    const ids: string[] = []
    for (const node of tree) {
      if (node.is_system) continue
      ids.push(node.id)
      if (expandedIds.has(node.id)) {
        node.children.forEach((c) => ids.push(c.id))
      }
    }
    return ids
  }, [tree, expandedIds])

  const pageMap = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      slug: newSlug,
      title: newTitle,
      content: { content: [], root: { props: {} } },
    })
  }

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
        setOverParentId(null)
        return
      }

      const overId = over.id as string
      const activePageData = pageMap.get(active.id as string)
      const overPageData = pageMap.get(overId)

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }

      const canNest =
        overPageData &&
        !overPageData.parent_id &&
        !overPageData.is_system &&
        overId !== (active.id as string) &&
        activePageData &&
        !activePageData.is_system

      if (canNest) {
        hoverTimerRef.current = setTimeout(() => {
          setOverParentId(overId)
          if (!expandedIds.has(overId)) {
            setExpandedIds((prev) => new Set(prev).add(overId))
          }
        }, 300)
      } else {
        setOverParentId(null)
      }
    },
    [pageMap, expandedIds]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const nestTargetId = overParentId
      setActiveId(null)
      setOverParentId(null)

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }

      const { active, over } = event
      if (!over || active.id === over.id) return

      const draggedId = active.id as string
      const overId = over.id as string

      const activePage = pageMap.get(draggedId)
      const overPage = pageMap.get(overId)

      if (!activePage || !overPage || activePage.is_system) return

      const newTree = tree.map((node) => ({
        ...node,
        children: [...node.children],
      }))

      const removeFromTree = (id: string) => {
        const rootIdx = newTree.findIndex((n) => n.id === id)
        if (rootIdx !== -1) {
          return newTree.splice(rootIdx, 1)[0]
        }
        for (const node of newTree) {
          const childIdx = node.children.findIndex((c) => c.id === id)
          if (childIdx !== -1) {
            return node.children.splice(childIdx, 1)[0]
          }
        }
        return null
      }

      const removed = removeFromTree(draggedId)
      if (!removed) return

      if (nestTargetId) {
        const targetNode = newTree.find((n) => n.id === nestTargetId)
        if (targetNode) {
          targetNode.children.push({
            ...removed,
            parent_id: nestTargetId,
            children_count: 0,
          } as CmsPage)

          const items = flattenTreeForReorder(newTree)
          reorderMutation.mutate(items)
          return
        }
      }

      const overParent = newTree.find((n) =>
        n.children.some((c) => c.id === overId)
      )

      if (overParent) {
        const overIdx = overParent.children.findIndex((c) => c.id === overId)
        overParent.children.splice(overIdx, 0, {
          ...removed,
          parent_id: overParent.id,
          children_count: 0,
        } as CmsPage)
      } else {
        const overRootIdx = newTree.findIndex((n) => n.id === overId)
        if (overRootIdx !== -1) {
          const removedAsTree: TreeNode = {
            ...removed,
            parent_id: null,
            children: (removed as TreeNode).children || [],
          }
          newTree.splice(overRootIdx, 0, removedAsTree)
        }
      }

      const items = flattenTreeForReorder(newTree)
      reorderMutation.mutate(items)
    },
    [tree, pageMap, reorderMutation, overParentId]
  )

  const systemPages = pages.filter((p) => p.is_system)
  const nonSystemCount = pages.filter((p) => !p.is_system).length

  return (
    <Container className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Heading level="h1">Pages</Heading>
            <span className="text-xs font-medium text-ui-fg-muted bg-ui-bg-subtle px-2 py-0.5 rounded-full">
              {pages.length}
            </span>
          </div>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Gerez l'arborescence de vos pages. Glissez pour reordonner.
          </Text>
        </div>
        <Button
          size="small"
          onClick={() => setShowCreate(!showCreate)}
          variant={showCreate ? "secondary" : "primary"}
        >
          {showCreate ? (
            "Annuler"
          ) : (
            <span className="flex items-center gap-1.5">
              <Plus style={{ width: 14, height: 14 }} />
              Nouvelle page
            </span>
          )}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="px-6 py-4"
          style={{
            borderTop: "1px solid var(--border-base, #e5e7eb)",
            borderBottom: "1px solid var(--border-base, #e5e7eb)",
            background: "var(--bg-subtle, #fafafa)",
          }}
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label size="small" className="mb-1.5">Titre</Label>
              <Input
                size="small"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="A propos"
                required
              />
            </div>
            <div className="flex-1">
              <Label size="small" className="mb-1.5">Slug</Label>
              <Input
                size="small"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="a-propos"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
              />
            </div>
            <Button
              size="small"
              type="submit"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Creer
            </Button>
          </div>
          {createMutation.isError && (
            <Text size="small" className="text-ui-fg-error mt-2">
              {(createMutation.error as Error).message}
            </Text>
          )}
        </form>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="px-6 py-12 text-center">
          <Text size="small" className="text-ui-fg-subtle">
            Chargement des pages...
          </Text>
        </div>
      ) : pages.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, background: "rgba(99, 102, 241, 0.08)" }}
            >
              <DocumentText className="text-ui-fg-muted" style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <Text size="small" weight="plus">Aucune page</Text>
              <Text size="small" className="text-ui-fg-subtle mt-0.5">
                Creez votre premiere page pour commencer.
              </Text>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Homepage always at top */}
          {systemPages.map((page) => (
            <HomepageRow
              key={page.id}
              page={page}
              onEdit={() => setEditingPage(page)}
              onNavigate={() => navigate(`/cms-pages/${page.id}`)}
            />
          ))}

          {/* Section label for other pages */}
          {nonSystemCount > 0 && (
            <div
              className="px-6 py-2 flex items-center gap-2"
              style={{
                borderBottom: "1px solid var(--border-base, #e5e7eb)",
                background: "var(--bg-subtle, #fafafa)",
              }}
            >
              <DocumentText className="text-ui-fg-disabled" style={{ width: 12, height: 12 }} />
              <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wider font-medium">
                Pages ({nonSystemCount})
              </Text>
            </div>
          )}

          {/* Draggable tree */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div>
                {tree
                  .filter((node) => !node.is_system)
                  .map((node) => (
                    <div
                      key={node.id}
                      style={{ borderBottom: "1px solid var(--border-base, #e5e7eb)" }}
                    >
                      <SortableRow
                        page={node}
                        isChild={false}
                        isExpanded={expandedIds.has(node.id)}
                        hasChildren={node.children.length > 0}
                        childCount={node.children.length}
                        isNestTarget={overParentId === node.id}
                        onToggleExpand={() => toggleExpand(node.id)}
                        onEdit={() => setEditingPage(node)}
                        onDelete={() => {
                          if (confirm("Supprimer cette page ?")) {
                            deleteMutation.mutate(node.id)
                          }
                        }}
                        onNavigate={() => navigate(`/cms-pages/${node.id}`)}
                      />
                      {expandedIds.has(node.id) &&
                        node.children.map((child) => (
                          <SortableRow
                            key={child.id}
                            page={child}
                            isChild={true}
                            onEdit={() => setEditingPage(child)}
                            onDelete={() => {
                              if (confirm("Supprimer cette page ?")) {
                                deleteMutation.mutate(child.id)
                              }
                            }}
                            onNavigate={() => navigate(`/cms-pages/${child.id}`)}
                          />
                        ))}
                    </div>
                  ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeId && pageMap.get(activeId) ? (
                <div
                  className="flex items-center gap-3 bg-ui-bg-base rounded-lg px-4 py-3"
                  style={{
                    boxShadow: "0 12px 32px -4px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                    width: 320,
                  }}
                >
                  <PageIcon />
                  <Text size="small" weight="plus">
                    {pageMap.get(activeId)!.title}
                  </Text>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {editingPage && (
        <EditPageModal
          page={editingPage}
          onClose={() => setEditingPage(null)}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "CMS Pages",
  icon: DocumentText,
  translationNs: 'translation'
})

export default CmsPagesList
