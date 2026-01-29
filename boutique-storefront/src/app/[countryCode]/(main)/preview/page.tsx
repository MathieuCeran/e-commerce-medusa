import { notFound } from "next/navigation"
import { getCmsPagePreview } from "@lib/data/cms-pages"
import { PuckRenderer } from "../page/[slug]/puck-renderer"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ token?: string }>
}

// Preview route for homepage (slug = "/")
export default async function HomepagePreview({ params, searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const page = await getCmsPagePreview("/", token)

  if (!page) {
    notFound()
  }

  return (
    <div>
      <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm font-semibold sticky top-0 z-50">
        PREVIEW MODE — This page is not published yet
      </div>
      <PuckRenderer data={page.content} />
    </div>
  )
}
