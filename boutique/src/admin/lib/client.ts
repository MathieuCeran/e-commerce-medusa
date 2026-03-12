import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: import.meta is used by Vite for admin bundle
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  // @ts-ignore: import.meta is used by Vite for admin bundle
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})
