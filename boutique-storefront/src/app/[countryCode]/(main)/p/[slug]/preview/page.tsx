import { notFound } from "next/navigation"
import { getCmsPagePreview } from "@lib/data/cms-pages"
import { PuckRenderer } from "../puck-renderer"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
  searchParams: Promise<{ token?: string }>
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

  return (
    <div>
      <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm font-semibold sticky top-0 z-50">
        PREVIEW MODE — This page is not published yet
      </div>
      <div className="content-container">
        <PuckRenderer data={page.content} />
      </div>
    </div>
  )
}
