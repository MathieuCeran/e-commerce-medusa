import type { Editor } from "grapesjs"

export function registerStaticTypes(editor: Editor) {
  // ─── Heading ────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-heading", {
    isComponent: (el) => el.classList?.contains("cms-heading"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-heading"],
        name: "Heading",
        droppable: false,
        traits: [
          {
            type: "select",
            name: "level",
            label: "Niveau",
            options: [
              { id: "h1", label: "H1" },
              { id: "h2", label: "H2" },
              { id: "h3", label: "H3" },
              { id: "h4", label: "H4" },
              { id: "h5", label: "H5" },
              { id: "h6", label: "H6" },
            ],
            default: "h2",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "h2",
            classes: ["cms-heading__text"],
            content: "Section Title",
            editable: true,
          },
        ],
        styles: `
          .cms-heading { padding: 32px 24px; }
          .cms-heading__text { font-size: 32px; font-weight: 700; color: #111827; text-align: center; margin: 0; }
        `,
      },
      init() {
        this.on("change:level", this.onLevelChange)
      },
      onLevelChange() {
        const heading = this.find(".cms-heading__text")[0]
        if (heading) {
          heading.set("tagName", this.get("level") || "h2")
        }
      },
    },
  })

  // ─── Rich Text ──────────────────────────────────────────────────────────────
  editor.Components.addType("cms-rich-text", {
    isComponent: (el) => el.classList?.contains("cms-rich-text"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-rich-text"],
        name: "Rich Text",
        droppable: true,
        traits: [],
        components: [
          {
            tagName: "h2",
            classes: ["cms-rich-text__title"],
            content: "Your Heading",
            editable: true,
          },
          {
            tagName: "p",
            classes: ["cms-rich-text__body"],
            content: "Write your content here. This is a rich text block where you can add paragraphs of text with a heading above.",
            editable: true,
          },
        ],
        styles: `
          .cms-rich-text { padding: 48px 24px; max-width: 800px; margin: 0 auto; }
          .cms-rich-text__title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 16px 0; }
          .cms-rich-text__body { font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0; }
        `,
      },
    },
  })

  // ─── Spacer ─────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-spacer", {
    isComponent: (el) => el.classList?.contains("cms-spacer"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-spacer"],
        name: "Spacer",
        droppable: false,
        traits: [
          {
            type: "number",
            name: "height",
            label: "Hauteur (px)",
            default: 48,
            min: 8,
            max: 200,
            changeProp: true,
          },
        ],
        styles: `.cms-spacer { height: 48px; }`,
      },
      init() {
        this.on("change:height", this.onHeightChange)
      },
      onHeightChange() {
        const h = this.get("height") || 48
        this.setStyle({ height: `${h}px` })
      },
    },
  })

  // ─── Divider ────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-divider", {
    isComponent: (el) => el.classList?.contains("cms-divider"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-divider"],
        name: "Divider",
        droppable: false,
        traits: [
          {
            type: "color",
            name: "divider-color",
            label: "Couleur",
            default: "#e5e7eb",
            changeProp: true,
          },
        ],
        components: [
          { tagName: "hr", classes: ["cms-divider__line"] },
        ],
        styles: `
          .cms-divider { padding: 24px; }
          .cms-divider__line { border: none; border-top: 1px solid #e5e7eb; max-width: 100%; margin: 0 auto; }
        `,
      },
      init() {
        this.on("change:divider-color", this.onColorChange)
      },
      onColorChange() {
        const hr = this.find(".cms-divider__line")[0]
        if (hr) {
          hr.setStyle({ "border-top-color": this.get("divider-color") || "#e5e7eb" })
        }
      },
    },
  })

  // ─── Hero ───────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-hero", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-hero"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-hero"],
        name: "Hero",
        droppable: false,
        traits: [
          { type: "text", name: "heading", label: "Titre", changeProp: true },
          { type: "text", name: "subheading", label: "Sous-titre", changeProp: true },
          { type: "text", name: "cta-text", label: "Texte du bouton", changeProp: true },
          { type: "text", name: "cta-url", label: "Lien du bouton", changeProp: true },
        ],
        components: [
          { tagName: "div", classes: ["cms-hero__overlay"] },
          {
            tagName: "div",
            classes: ["cms-hero__content"],
            components: [
              { tagName: "h1", classes: ["cms-hero__title"], content: "Welcome to Our Store", editable: true },
              { tagName: "p", classes: ["cms-hero__subtitle"], content: "Discover our latest collection of premium products", editable: true },
              {
                tagName: "div",
                classes: ["cms-hero__actions"],
                components: [
                  { tagName: "a", classes: ["cms-hero__cta"], content: "Shop Now", attributes: { href: "/store" }, editable: true },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-hero { position: relative; width: 100%; min-height: 500px; display: flex; background: #1f2937; }
          .cms-hero__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
          .cms-hero__content { position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; width: 100%; padding: 64px 24px; max-width: 1280px; margin: 0 auto; }
          .cms-hero__title { font-size: 48px; font-weight: 700; color: #ffffff; max-width: 800px; line-height: 1.2; margin: 0; }
          .cms-hero__subtitle { margin-top: 20px; font-size: 18px; color: #ffffff; opacity: 0.9; max-width: 600px; line-height: 1.6; }
          .cms-hero__actions { display: flex; gap: 16px; margin-top: 32px; flex-wrap: wrap; }
          .cms-hero__cta { display: inline-block; padding: 14px 32px; background: #ffffff; color: #000000; font-weight: 600; border-radius: 4px; text-decoration: none; }
        `,
      },
      init() {
        this.on("change:heading", this.syncHeading)
        this.on("change:subheading", this.syncSubheading)
        this.on("change:cta-text", this.syncCtaText)
        this.on("change:cta-url", this.syncCtaUrl)
      },
      syncHeading() { const el = this.find(".cms-hero__title")[0]; if (el) el.set("content", this.get("heading")) },
      syncSubheading() { const el = this.find(".cms-hero__subtitle")[0]; if (el) el.set("content", this.get("subheading")) },
      syncCtaText() { const el = this.find(".cms-hero__cta")[0]; if (el) el.set("content", this.get("cta-text")) },
      syncCtaUrl() { const el = this.find(".cms-hero__cta")[0]; if (el) el.addAttributes({ href: this.get("cta-url") || "/store" }) },
    },
  })

  // ─── CTA ────────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-cta", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-cta"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-cta"],
        name: "Call to Action",
        droppable: false,
        traits: [
          { type: "text", name: "heading", label: "Titre", changeProp: true },
          { type: "text", name: "description", label: "Description", changeProp: true },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-cta__inner"],
            components: [
              { tagName: "h2", classes: ["cms-cta__title"], content: "Ready to get started?", editable: true },
              { tagName: "p", classes: ["cms-cta__desc"], content: "Join thousands of customers who trust us.", editable: true },
              {
                tagName: "div",
                classes: ["cms-cta__actions"],
                components: [
                  { tagName: "a", classes: ["cms-cta__btn-primary"], content: "Get Started", attributes: { href: "/" }, editable: true },
                  { tagName: "a", classes: ["cms-cta__btn-secondary"], content: "Learn More", attributes: { href: "/" }, editable: true },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-cta { background: #111827; padding: 64px 24px; }
          .cms-cta__inner { max-width: 768px; margin: 0 auto; text-align: center; }
          .cms-cta__title { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
          .cms-cta__desc { margin-top: 16px; font-size: 18px; color: #ffffff; opacity: 0.85; line-height: 1.6; }
          .cms-cta__actions { display: flex; gap: 16px; margin-top: 28px; justify-content: center; flex-wrap: wrap; }
          .cms-cta__btn-primary { display: inline-block; padding: 14px 28px; background: #ffffff; color: #111827; font-weight: 600; border-radius: 4px; text-decoration: none; }
          .cms-cta__btn-secondary { display: inline-block; padding: 14px 28px; color: #ffffff; font-weight: 600; border-radius: 4px; text-decoration: none; border: 2px solid #ffffff; }
        `,
      },
      init() {
        this.on("change:heading", this.syncHeading)
        this.on("change:description", this.syncDesc)
      },
      syncHeading() { const el = this.find(".cms-cta__title")[0]; if (el) el.set("content", this.get("heading")) },
      syncDesc() { const el = this.find(".cms-cta__desc")[0]; if (el) el.set("content", this.get("description")) },
    },
  })

  // ─── Features ───────────────────────────────────────────────────────────────
  editor.Components.addType("cms-features", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-features"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-features"],
        name: "Features",
        droppable: false,
        traits: [
          {
            type: "select",
            name: "columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "3",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-features__inner"],
            components: [
              {
                tagName: "div",
                classes: ["cms-features__header"],
                components: [
                  { tagName: "h2", classes: ["cms-features__title"], content: "Why Choose Us", editable: true },
                  { tagName: "p", classes: ["cms-features__subtitle"], content: "Everything you need to succeed", editable: true },
                ],
              },
              {
                tagName: "div",
                classes: ["cms-features__grid"],
                components: [
                  {
                    tagName: "div", classes: ["cms-features__item"],
                    components: [
                      { tagName: "span", classes: ["cms-features__icon"], content: "\u{1F680}" },
                      { tagName: "h3", classes: ["cms-features__item-title"], content: "Fast Delivery", editable: true },
                      { tagName: "p", classes: ["cms-features__item-desc"], content: "Get your products delivered quickly and efficiently", editable: true },
                    ],
                  },
                  {
                    tagName: "div", classes: ["cms-features__item"],
                    components: [
                      { tagName: "span", classes: ["cms-features__icon"], content: "\u{1F512}" },
                      { tagName: "h3", classes: ["cms-features__item-title"], content: "Secure Payment", editable: true },
                      { tagName: "p", classes: ["cms-features__item-desc"], content: "Your transactions are protected with enterprise-grade security", editable: true },
                    ],
                  },
                  {
                    tagName: "div", classes: ["cms-features__item"],
                    components: [
                      { tagName: "span", classes: ["cms-features__icon"], content: "\u{1F4AC}" },
                      { tagName: "h3", classes: ["cms-features__item-title"], content: "24/7 Support", editable: true },
                      { tagName: "p", classes: ["cms-features__item-desc"], content: "Our team is here to help you anytime, anywhere", editable: true },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-features { padding: 64px 24px; background: #ffffff; }
          .cms-features__inner { max-width: 1280px; margin: 0 auto; }
          .cms-features__header { text-align: center; margin-bottom: 48px; }
          .cms-features__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0; }
          .cms-features__subtitle { margin-top: 12px; font-size: 18px; color: #6b7280; }
          .cms-features__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
          .cms-features__item { text-align: center; padding: 16px; }
          .cms-features__icon { font-size: 40px; display: block; margin-bottom: 16px; }
          .cms-features__item-title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
          .cms-features__item-desc { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0; }
        `,
      },
      init() {
        this.on("change:columns", this.onColumnsChange)
      },
      onColumnsChange() {
        const grid = this.find(".cms-features__grid")[0]
        if (grid) {
          grid.setStyle({ "grid-template-columns": `repeat(${this.get("columns") || 3}, 1fr)` })
        }
      },
    },
  })

  // ─── FAQ ────────────────────────────────────────────────────────────────────
  editor.Components.addType("cms-faq", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-faq"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-faq"],
        name: "FAQ",
        droppable: false,
        traits: [],
        components: [
          {
            tagName: "div",
            classes: ["cms-faq__inner"],
            components: [
              {
                tagName: "div",
                classes: ["cms-faq__header"],
                components: [
                  { tagName: "h2", classes: ["cms-faq__title"], content: "Frequently Asked Questions", editable: true },
                  { tagName: "p", classes: ["cms-faq__subtitle"], content: "Find answers to common questions", editable: true },
                ],
              },
              {
                tagName: "div",
                classes: ["cms-faq__list"],
                components: [
                  {
                    tagName: "details", classes: ["cms-faq__item"],
                    components: [
                      { tagName: "summary", classes: ["cms-faq__question"], content: "What is your return policy?", editable: true },
                      { tagName: "p", classes: ["cms-faq__answer"], content: "We offer a 30-day return policy on all items.", editable: true },
                    ],
                  },
                  {
                    tagName: "details", classes: ["cms-faq__item"],
                    components: [
                      { tagName: "summary", classes: ["cms-faq__question"], content: "How long does shipping take?", editable: true },
                      { tagName: "p", classes: ["cms-faq__answer"], content: "Standard shipping takes 3-5 business days.", editable: true },
                    ],
                  },
                  {
                    tagName: "details", classes: ["cms-faq__item"],
                    components: [
                      { tagName: "summary", classes: ["cms-faq__question"], content: "Do you ship internationally?", editable: true },
                      { tagName: "p", classes: ["cms-faq__answer"], content: "Yes! We ship to over 50 countries worldwide.", editable: true },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-faq { padding: 64px 24px; background: #f9fafb; }
          .cms-faq__inner { max-width: 768px; margin: 0 auto; }
          .cms-faq__header { text-align: center; margin-bottom: 40px; }
          .cms-faq__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0; }
          .cms-faq__subtitle { margin-top: 12px; font-size: 18px; color: #4b5563; }
          .cms-faq__list { border-top: 1px solid #e5e7eb; }
          .cms-faq__item { padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
          .cms-faq__question { font-weight: 600; color: #111827; cursor: pointer; list-style: none; }
          .cms-faq__answer { margin-top: 16px; color: #4b5563; line-height: 1.6; }
        `,
      },
    },
  })

  // ─── Image & Text ───────────────────────────────────────────────────────────
  editor.Components.addType("cms-image-text", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-image-text"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-image-text"],
        name: "Image & Text",
        droppable: false,
        traits: [
          {
            type: "select",
            name: "image-position",
            label: "Position image",
            options: [
              { id: "left", label: "Gauche" },
              { id: "right", label: "Droite" },
            ],
            default: "left",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-image-text__inner"],
            components: [
              {
                tagName: "div",
                classes: ["cms-image-text__media"],
                components: [
                  { tagName: "img", classes: ["cms-image-text__img"], attributes: { src: "https://placehold.co/600x400", alt: "Image" } },
                ],
              },
              {
                tagName: "div",
                classes: ["cms-image-text__content"],
                components: [
                  { tagName: "h2", classes: ["cms-image-text__title"], content: "Your Title Here", editable: true },
                  { tagName: "p", classes: ["cms-image-text__desc"], content: "Write a compelling description for this section. Explain your product, service, or story here.", editable: true },
                  { tagName: "a", classes: ["cms-image-text__link"], content: "Learn More", attributes: { href: "/" }, editable: true },
                ],
              },
            ],
          },
        ],
        styles: `
          .cms-image-text { padding: 64px 24px; }
          .cms-image-text__inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
          .cms-image-text__img { width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .cms-image-text__title { font-size: 32px; font-weight: 700; color: #111827; margin: 0; }
          .cms-image-text__desc { margin-top: 16px; font-size: 16px; color: #4b5563; line-height: 1.7; }
          .cms-image-text__link { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #111827; color: #ffffff; font-weight: 600; border-radius: 4px; text-decoration: none; }
        `,
      },
      init() {
        this.on("change:image-position", this.onPositionChange)
      },
      onPositionChange() {
        const inner = this.find(".cms-image-text__inner")[0]
        if (!inner) return
        const pos = this.get("image-position") || "left"
        if (pos === "right") {
          inner.setStyle({ direction: "rtl" })
          inner.find("*").forEach((c: any) => c.setStyle({ direction: "ltr" }))
        } else {
          inner.setStyle({ direction: "ltr" })
        }
      },
    },
  })

  // ─── Card Grid ──────────────────────────────────────────────────────────────
  editor.Components.addType("cms-card-grid", {
    isComponent: (el) => el.tagName === "SECTION" && el.classList?.contains("cms-card-grid"),
    model: {
      defaults: {
        tagName: "section",
        classes: ["cms-card-grid"],
        name: "Card Grid",
        droppable: false,
        traits: [
          {
            type: "select",
            name: "columns",
            label: "Colonnes",
            options: [
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ],
            default: "3",
            changeProp: true,
          },
        ],
        components: [
          {
            tagName: "div",
            classes: ["cms-card-grid__grid"],
            components: Array.from({ length: 3 }, (_, i) => ({
              tagName: "div",
              classes: ["cms-card-grid__card"],
              components: [
                { tagName: "img", classes: ["cms-card-grid__img"], attributes: { src: "https://placehold.co/400x250", alt: `Card ${i + 1}` } },
                {
                  tagName: "div",
                  classes: ["cms-card-grid__body"],
                  components: [
                    { tagName: "h3", classes: ["cms-card-grid__title"], content: "Card Title", editable: true },
                    { tagName: "p", classes: ["cms-card-grid__desc"], content: "Card description goes here.", editable: true },
                    { tagName: "a", classes: ["cms-card-grid__link"], content: "Learn more →", attributes: { href: "/" }, editable: true },
                  ],
                },
              ],
            })),
          },
        ],
        styles: `
          .cms-card-grid { padding: 64px 24px; background: #ffffff; }
          .cms-card-grid__grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .cms-card-grid__card { background: #f9fafb; border-radius: 8px; overflow: hidden; }
          .cms-card-grid__img { width: 100%; height: 200px; object-fit: cover; }
          .cms-card-grid__body { padding: 24px; }
          .cms-card-grid__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0; }
          .cms-card-grid__desc { margin-top: 8px; font-size: 14px; color: #6b7280; line-height: 1.6; }
          .cms-card-grid__link { display: inline-block; margin-top: 16px; font-size: 14px; font-weight: 600; color: #111827; text-decoration: none; }
        `,
      },
      init() {
        this.on("change:columns", this.onColumnsChange)
      },
      onColumnsChange() {
        const grid = this.find(".cms-card-grid__grid")[0]
        if (grid) {
          grid.setStyle({ "grid-template-columns": `repeat(${this.get("columns") || 3}, 1fr)` })
        }
      },
    },
  })
}
