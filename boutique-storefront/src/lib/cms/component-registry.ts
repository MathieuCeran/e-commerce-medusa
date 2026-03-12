import { ComponentType } from "react"
import { StoreRegion } from "@medusajs/types"

export type RenderContext = {
  region: StoreRegion
  countryCode: string
}

export type ComponentEntry = {
  component: ComponentType<any>
  /**
   * Optional async function to fetch server-side data during SSR.
   * The returned object is spread as props on the component.
   */
  serverDataFn?: (
    attrs: Record<string, string>,
    context: RenderContext
  ) => Promise<Record<string, any>>
}

const registry: Record<string, ComponentEntry> = {}

export function registerComponent(name: string, entry: ComponentEntry) {
  registry[name] = entry
}

export function getComponent(name: string): ComponentEntry | undefined {
  return registry[name]
}

export function getAllRegisteredNames(): string[] {
  return Object.keys(registry)
}
