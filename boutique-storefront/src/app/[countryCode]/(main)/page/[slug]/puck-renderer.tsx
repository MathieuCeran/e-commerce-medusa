"use client"

import { Render } from "@puckeditor/core"
import { puckConfig } from "@lib/puck/config"

type PuckRendererProps = {
  data: Record<string, unknown>
}

export function PuckRenderer({ data }: PuckRendererProps) {
  return <Render config={puckConfig} data={data as any} />
}
