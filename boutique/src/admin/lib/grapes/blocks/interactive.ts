import type { Editor } from "grapesjs"

export function registerInteractiveBlocks(editor: Editor) {
  const bm = editor.Blocks

  // ─── Accordion (static, no hydration) ────────────────────────────────────
  bm.add("accordion", {
    label: "Accordion",
    category: "Interactive",
    content: `<div style="max-width:700px;margin:0 auto;font-family:inherit;">
  <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
    <summary style="cursor:pointer;font-weight:600;font-size:16px;color:#111827;list-style:none;display:flex;justify-content:space-between;align-items:center;">
      Question one
      <span style="font-size:20px;line-height:1;">+</span>
    </summary>
    <p style="margin-top:12px;color:#6b7280;line-height:1.6;">
      Answer to question one goes here. You can add any content inside this panel.
    </p>
  </details>
  <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
    <summary style="cursor:pointer;font-weight:600;font-size:16px;color:#111827;list-style:none;display:flex;justify-content:space-between;align-items:center;">
      Question two
      <span style="font-size:20px;line-height:1;">+</span>
    </summary>
    <p style="margin-top:12px;color:#6b7280;line-height:1.6;">
      Answer to question two goes here. You can add any content inside this panel.
    </p>
  </details>
  <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
    <summary style="cursor:pointer;font-weight:600;font-size:16px;color:#111827;list-style:none;display:flex;justify-content:space-between;align-items:center;">
      Question three
      <span style="font-size:20px;line-height:1;">+</span>
    </summary>
    <p style="margin-top:12px;color:#6b7280;line-height:1.6;">
      Answer to question three goes here. You can add any content inside this panel.
    </p>
  </details>
</div>`,
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="4" rx="1"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="3" y="12" width="18" height="4" rx="1"/><line x1="3" y1="18" x2="21" y2="18"/><rect x="3" y="20" width="18" height="4" rx="1"/></svg>`,
  })

  // ─── Tabs (hydrated) ──────────────────────────────────────────────────────
  bm.add("tabs", {
    label: "Tabs",
    category: "Interactive",
    content: `<div data-component="tabs" style="max-width:800px;margin:0 auto;font-family:inherit;">
  <div style="display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:24px;">
    <button data-tab="0" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:15px;font-weight:600;color:#111827;border-bottom:2px solid #111827;margin-bottom:-2px;">Tab One</button>
    <button data-tab="1" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:15px;font-weight:400;color:#6b7280;">Tab Two</button>
    <button data-tab="2" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:15px;font-weight:400;color:#6b7280;">Tab Three</button>
  </div>
  <div data-tab-panel="0" style="color:#374151;line-height:1.6;">
    <p>Content for the first tab. Replace this with your own content.</p>
  </div>
  <div data-tab-panel="1" style="display:none;color:#374151;line-height:1.6;">
    <p>Content for the second tab. Replace this with your own content.</p>
  </div>
  <div data-tab-panel="2" style="display:none;color:#374151;line-height:1.6;">
    <p>Content for the third tab. Replace this with your own content.</p>
  </div>
</div>`,
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="6" height="3" rx="1"/><rect x="9" y="6" width="6" height="3" rx="1"/><rect x="16" y="6" width="6" height="3" rx="1"/><rect x="2" y="9" width="20" height="10" rx="1"/></svg>`,
  })

  editor.DomComponents.addType("tabs", {
    isComponent: (el) => el.getAttribute?.("data-component") === "tabs",
    model: {
      defaults: {
        droppable: true,
        traits: [],
      },
    },
  })

  // ─── Stats Counter (hydrated) ─────────────────────────────────────────────
  bm.add("stats-counter", {
    label: "Stats Counter",
    category: "Interactive",
    content: `<section data-component="stats-counter" style="padding:64px 24px;background:#f9fafb;text-align:center;font-family:inherit;">
  <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:40px;">
    <div>
      <div style="font-size:48px;font-weight:700;color:#111827;line-height:1;"><span data-target="1500">0</span>+</div>
      <div style="margin-top:8px;font-size:16px;color:#6b7280;">Happy Customers</div>
    </div>
    <div>
      <div style="font-size:48px;font-weight:700;color:#111827;line-height:1;"><span data-target="300">0</span>+</div>
      <div style="margin-top:8px;font-size:16px;color:#6b7280;">Products Available</div>
    </div>
    <div>
      <div style="font-size:48px;font-weight:700;color:#111827;line-height:1;"><span data-target="50">0</span>+</div>
      <div style="margin-top:8px;font-size:16px;color:#6b7280;">Countries Served</div>
    </div>
  </div>
</section>`,
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="14" width="5" height="7" rx="1"/><rect x="9.5" y="9" width="5" height="12" rx="1"/><rect x="17" y="4" width="5" height="17" rx="1"/></svg>`,
  })

  editor.DomComponents.addType("stats-counter", {
    isComponent: (el) =>
      el.getAttribute?.("data-component") === "stats-counter",
    model: {
      defaults: {
        droppable: true,
        traits: [],
      },
    },
  })

  // ─── Testimonials Carousel (hydrated) ────────────────────────────────────
  bm.add("testimonials-carousel", {
    label: "Testimonials Carousel",
    category: "Interactive",
    content: `<section data-component="testimonials-carousel" data-autoplay="true" data-interval="5000" style="padding:64px 24px;background:#ffffff;text-align:center;font-family:inherit;">
  <div style="max-width:700px;margin:0 auto;">
    <h2 style="font-size:28px;font-weight:700;color:#111827;margin-bottom:40px;">What Our Customers Say</h2>
    <div style="position:relative;">
      <div data-slide="0" style="color:#374151;">
        <p style="font-size:18px;line-height:1.7;font-style:italic;color:#374151;">"An absolutely amazing product. It exceeded all my expectations and I would highly recommend it to anyone."</p>
        <div style="margin-top:20px;font-weight:600;color:#111827;">Jane Doe</div>
        <div style="font-size:14px;color:#9ca3af;">Verified Customer</div>
      </div>
      <div data-slide="1" style="display:none;color:#374151;">
        <p style="font-size:18px;line-height:1.7;font-style:italic;color:#374151;">"The quality is outstanding and the delivery was super fast. Will definitely be ordering again soon!"</p>
        <div style="margin-top:20px;font-weight:600;color:#111827;">John Smith</div>
        <div style="font-size:14px;color:#9ca3af;">Verified Customer</div>
      </div>
      <div data-slide="2" style="display:none;color:#374151;">
        <p style="font-size:18px;line-height:1.7;font-style:italic;color:#374151;">"Customer service was incredibly helpful. The whole experience from browsing to delivery was flawless."</p>
        <div style="margin-top:20px;font-weight:600;color:#111827;">Emily Johnson</div>
        <div style="font-size:14px;color:#9ca3af;">Verified Customer</div>
      </div>
    </div>
    <div style="display:flex;justify-content:center;gap:8px;margin-top:32px;">
      <button data-dot="0" style="width:10px;height:10px;border-radius:50%;background:#111827;border:none;cursor:pointer;padding:0;"></button>
      <button data-dot="1" style="width:10px;height:10px;border-radius:50%;background:#d1d5db;border:none;cursor:pointer;padding:0;"></button>
      <button data-dot="2" style="width:10px;height:10px;border-radius:50%;background:#d1d5db;border:none;cursor:pointer;padding:0;"></button>
    </div>
  </div>
</section>`,
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
  })

  editor.DomComponents.addType("testimonials-carousel", {
    isComponent: (el) =>
      el.getAttribute?.("data-component") === "testimonials-carousel",
    model: {
      defaults: {
        traits: [
          {
            type: "checkbox",
            name: "data-autoplay",
            label: "Autoplay",
          },
          {
            type: "number",
            name: "data-interval",
            label: "Interval (ms)",
            default: 5000,
            min: 1000,
            max: 15000,
            step: 500,
          },
        ],
      },
    },
  })

  // ─── Announcement Bar (hydrated) ──────────────────────────────────────────
  bm.add("announcement-bar", {
    label: "Announcement Bar",
    category: "Interactive",
    content: `<div data-component="announcement-bar" data-dismissible="true" data-id="promo-1" style="background:#111827;color:#ffffff;text-align:center;padding:10px 40px;font-size:13px;font-family:inherit;position:relative;">
  <span>Free shipping on all orders over $50 — Use code <strong>FREESHIP</strong> at checkout</span>
  <button data-dismiss style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#ffffff;cursor:pointer;font-size:18px;line-height:1;padding:4px;">×</button>
</div>`,
    media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="6" rx="1"/><line x1="6" y1="10" x2="18" y2="10"/><circle cx="19" cy="10" r="0.5" fill="currentColor"/></svg>`,
  })

  editor.DomComponents.addType("announcement-bar", {
    isComponent: (el) =>
      el.getAttribute?.("data-component") === "announcement-bar",
    model: {
      defaults: {
        traits: [
          {
            type: "checkbox",
            name: "data-dismissible",
            label: "Dismissible",
          },
          {
            type: "text",
            name: "data-id",
            label: "Bar ID",
          },
        ],
      },
    },
  })
}
