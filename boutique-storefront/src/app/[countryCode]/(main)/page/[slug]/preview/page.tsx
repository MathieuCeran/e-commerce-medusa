import { notFound } from "next/navigation"
import { getCmsPagePreview } from "@lib/data/cms-pages"
import { GjsRenderer } from "../gjs-renderer"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
  searchParams: Promise<{ token?: string }>
}

type GjsContent = {
  gjsHtml?: string
  gjsCss?: string
}

export default async function CmsPreviewPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const page = await getCmsPagePreview(slug, token)

  if (!page) {
    notFound()
  }

  const content = page.content as GjsContent

  if (!content?.gjsHtml) {
    return (
      <p style={{ textAlign: "center", padding: 64, color: "#999" }}>
        This page uses a legacy format. Please re-edit it in the CMS editor.
      </p>
    )
  }

  return (
    <div>
      <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm font-semibold sticky top-0 z-50">
        PREVIEW MODE — This page is not published yet
      </div>
      <div className="content-container">
        <GjsRenderer html={content.gjsHtml} css={content.gjsCss || ""} />
      </div>
    </div>
  )
}
