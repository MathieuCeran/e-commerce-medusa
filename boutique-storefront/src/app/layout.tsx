import { getThemeSettings } from "@lib/data/cms-pages"
import { ThemeProvider } from "@lib/context/theme-provider"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const themeSettings = await getThemeSettings()

  return (
    <html lang="en" data-mode="light">
      <body>
        <ThemeProvider settings={themeSettings}>
          <main className="relative">{props.children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
