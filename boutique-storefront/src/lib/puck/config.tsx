import type { Config } from "@puckeditor/core"
import { Hero } from "./components/hero"
import { RichText } from "./components/rich-text"
import { ImageBlock } from "./components/image-block"
import { CTA } from "./components/cta"
import { Features } from "./components/features"
import { FAQ } from "./components/faq"
import { Spacer } from "./components/spacer"
import { ProductsGrid } from "./components/products-grid"
import { ImageText } from "./components/image-text"
import { CardGrid } from "./components/card-grid"

export const puckConfig: Config = {
  components: {
    Hero,
    RichText,
    ImageBlock,
    CTA,
    Features,
    FAQ,
    Spacer,
    ProductsGrid,
    ImageText,
    CardGrid,
  },
}
