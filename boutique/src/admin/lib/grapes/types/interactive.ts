import type { Editor } from "grapesjs"

export function registerInteractiveTypes(editor: Editor) {
  // ─── Accordion (static, new type) ──────────────────────────────────────────
  editor.Components.addType("cms-accordion", {
    isComponent: (el) => el.classList?.contains("cms-accordion"),
    model: {
      defaults: {
        tagName: "div",
        classes: ["cms-accordion"],
        name: "Accordion",
        droppable: false,
        traits: [],
        components: [
          {
            tagName: "details", classes: ["cms-accordion__item"],
            components: [
              { tagName: "summary", classes: ["cms-accordion__question"], content: "Question one", editable: true },
              { tagName: "p", classes: ["cms-accordion__answer"], content: "Answer to question one goes here.", editable: true },
            ],
          },
          {
            tagName: "details", classes: ["cms-accordion__item"],
            components: [
              { tagName: "summary", classes: ["cms-accordion__question"], content: "Question two", editable: true },
              { tagName: "p", classes: ["cms-accordion__answer"], content: "Answer to question two goes here.", editable: true },
            ],
          },
          {
            tagName: "details", classes: ["cms-accordion__item"],
            components: [
              { tagName: "summary", classes: ["cms-accordion__question"], content: "Question three", editable: true },
              { tagName: "p", classes: ["cms-accordion__answer"], content: "Answer to question three goes here.", editable: true },
            ],
          },
        ],
        styles: `
          .cms-accordion { max-width: 700px; margin: 0 auto; }
          .cms-accordion__item { border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
          .cms-accordion__question { cursor: pointer; font-weight: 600; font-size: 16px; color: #111827; list-style: none; display: flex; justify-content: space-between; align-items: center; }
          .cms-accordion__answer { margin-top: 12px; color: #6b7280; line-height: 1.6; }
        `,
      },
    },
  })

  // ─── Tabs (hydrated) ───────────────────────────────────────────────────────
  editor.Components.addType("tabs", {
    isComponent: (el) => el.getAttribute?.("data-component") === "tabs",
    model: {
      defaults: {
        name: "Tabs",
        droppable: false,
        attributes: { "data-component": "tabs" },
        traits: [],
      },
    },
  })

  // ─── Stats Counter (hydrated) ──────────────────────────────────────────────
  editor.Components.addType("stats-counter", {
    isComponent: (el) => el.getAttribute?.("data-component") === "stats-counter",
    model: {
      defaults: {
        tagName: "section",
        name: "Stats Counter",
        droppable: false,
        attributes: { "data-component": "stats-counter" },
        traits: [],
      },
    },
  })

  // ─── Testimonials Carousel (hydrated) ──────────────────────────────────────
  editor.Components.addType("testimonials-carousel", {
    isComponent: (el) => el.getAttribute?.("data-component") === "testimonials-carousel",
    model: {
      defaults: {
        tagName: "section",
        name: "Testimonials",
        droppable: false,
        attributes: { "data-component": "testimonials-carousel" },
        traits: [
          { type: "checkbox", name: "data-autoplay", label: "Autoplay" },
          { type: "number", name: "data-interval", label: "Interval (ms)", default: 5000, min: 1000, max: 15000, step: 500 },
        ],
      },
    },
  })

  // ─── Announcement Bar (hydrated) ───────────────────────────────────────────
  editor.Components.addType("announcement-bar", {
    isComponent: (el) => el.getAttribute?.("data-component") === "announcement-bar",
    model: {
      defaults: {
        name: "Announcement Bar",
        droppable: false,
        attributes: { "data-component": "announcement-bar" },
        traits: [
          { type: "checkbox", name: "data-dismissible", label: "Dismissible" },
          { type: "text", name: "data-id", label: "Bar ID" },
        ],
      },
    },
  })
}
