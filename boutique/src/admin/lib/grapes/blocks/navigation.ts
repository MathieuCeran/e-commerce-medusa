import type { Editor } from "grapesjs"

export function registerNavigationBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("header-simple", {
    label: "Header Simple",
    category: "Navigation",
    content: `<header data-component="site-header" data-variant="simple" style="width:100%;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="font-size:20px;font-weight:700;color:#111827;text-decoration:none;">Boutique</a>
        <nav style="display:flex;gap:32px;align-items:center;">
          <a href="/" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Boutique</a>
          <a href="/about" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">A propos</a>
          <a href="/contact" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Contact</a>
        </nav>
        <a href="/store" style="display:inline-block;padding:10px 20px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;border-radius:4px;text-decoration:none;">Shop Now</a>
      </div>
    </header>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="4" rx="1"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="16" y2="14"/><line x1="18" y1="14" x2="22" y2="14"/></svg>',
  })

  bm.add("header-ecommerce", {
    label: "Header E-commerce",
    category: "Navigation",
    content: `<header data-component="site-header" data-variant="ecommerce" style="width:100%;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;gap:32px;">
        <a href="/" style="font-size:20px;font-weight:700;color:#111827;text-decoration:none;flex-shrink:0;">Boutique</a>
        <nav style="display:flex;gap:24px;align-items:center;flex:1;">
          <a href="/" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Boutique</a>
          <a href="/about" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">A propos</a>
          <a href="/contact" style="font-size:14px;color:#374151;text-decoration:none;font-weight:500;">Contact</a>
        </nav>
        <div style="display:flex;align-items:center;gap:16px;">
          <span data-slot="search" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128269;</span>
          <span data-slot="account" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128100;</span>
          <span data-slot="cart" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128722;</span>
        </div>
      </div>
    </header>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="4" rx="1"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="18" cy="15" r="2"/><path d="M6 13h4M2 15h4"/></svg>',
  })

  bm.add("header-minimal", {
    label: "Header Minimal",
    category: "Navigation",
    content: `<header data-component="site-header" data-variant="minimal" style="width:100%;background:#ffffff;border-bottom:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;">
        <span style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#9776;</span>
        <a href="/" style="font-size:18px;font-weight:700;color:#111827;text-decoration:none;position:absolute;left:50%;transform:translateX(-50%);">Boutique</a>
        <span data-slot="cart" style="cursor:pointer;color:#374151;font-size:20px;line-height:1;">&#128722;</span>
      </div>
    </header>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="3" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
  })

  bm.add("footer-full", {
    label: "Footer Complet",
    category: "Navigation",
    content: `<footer data-component="site-footer" data-variant="full" style="background:#111827;color:#ffffff;">
      <div style="max-width:1280px;margin:0 auto;padding:64px 24px 40px;">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px;">
          <div>
            <a href="/" style="font-size:22px;font-weight:700;color:#ffffff;text-decoration:none;display:block;margin-bottom:16px;">Boutique</a>
            <p style="font-size:14px;color:#9ca3af;line-height:1.7;max-width:280px;">Votre boutique de confiance pour des produits de qualite. Livraison rapide partout en France.</p>
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#d1d5db;margin-bottom:16px;">Boutique</h4>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
              <li><a href="/store" style="font-size:14px;color:#9ca3af;text-decoration:none;">Tous les produits</a></li>
              <li><a href="/store/nouveautes" style="font-size:14px;color:#9ca3af;text-decoration:none;">Nouveautes</a></li>
              <li><a href="/store/promotions" style="font-size:14px;color:#9ca3af;text-decoration:none;">Promotions</a></li>
              <li><a href="/store/marques" style="font-size:14px;color:#9ca3af;text-decoration:none;">Marques</a></li>
            </ul>
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#d1d5db;margin-bottom:16px;">Informations</h4>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
              <li><a href="/about" style="font-size:14px;color:#9ca3af;text-decoration:none;">A propos</a></li>
              <li><a href="/contact" style="font-size:14px;color:#9ca3af;text-decoration:none;">Contact</a></li>
              <li><a href="/livraison" style="font-size:14px;color:#9ca3af;text-decoration:none;">Livraison</a></li>
              <li><a href="/retours" style="font-size:14px;color:#9ca3af;text-decoration:none;">Retours</a></li>
            </ul>
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#d1d5db;margin-bottom:16px;">Suivez-nous</h4>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <a href="#" style="font-size:14px;color:#9ca3af;text-decoration:none;">Instagram</a>
              <a href="#" style="font-size:14px;color:#9ca3af;text-decoration:none;">Facebook</a>
              <a href="#" style="font-size:14px;color:#9ca3af;text-decoration:none;">Pinterest</a>
              <a href="#" style="font-size:14px;color:#9ca3af;text-decoration:none;">TikTok</a>
            </div>
          </div>
        </div>
        <div style="border-top:1px solid #374151;padding-top:24px;display:flex;align-items:center;justify-content:space-between;">
          <p style="font-size:13px;color:#6b7280;">&copy; 2024 Boutique. Tous droits reserves.</p>
          <div style="display:flex;gap:24px;">
            <a href="/cgv" style="font-size:13px;color:#6b7280;text-decoration:none;">CGV</a>
            <a href="/confidentialite" style="font-size:13px;color:#6b7280;text-decoration:none;">Confidentialite</a>
            <a href="/mentions-legales" style="font-size:13px;color:#6b7280;text-decoration:none;">Mentions legales</a>
          </div>
        </div>
      </div>
    </footer>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="8" x2="22" y2="8"/><rect x="2" y="8" width="20" height="13" rx="1"/><line x1="7" y1="12" x2="7" y2="18"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="17" y1="12" x2="17" y2="18"/></svg>',
  })

  bm.add("footer-minimal", {
    label: "Footer Minimal",
    category: "Navigation",
    content: `<footer data-component="site-footer" data-variant="minimal" style="background:#f9fafb;border-top:1px solid #e5e7eb;">
      <div style="max-width:1280px;margin:0 auto;padding:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <a href="/" style="font-size:16px;font-weight:700;color:#111827;text-decoration:none;">Boutique</a>
        <nav style="display:flex;gap:24px;align-items:center;">
          <a href="/cgv" style="font-size:13px;color:#6b7280;text-decoration:none;">CGV</a>
          <a href="/confidentialite" style="font-size:13px;color:#6b7280;text-decoration:none;">Confidentialite</a>
          <a href="/contact" style="font-size:13px;color:#6b7280;text-decoration:none;">Contact</a>
        </nav>
        <p style="font-size:13px;color:#9ca3af;">&copy; 2024 Boutique</p>
      </div>
    </footer>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="16" x2="22" y2="16"/><rect x="2" y="16" width="20" height="5" rx="1"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="12" y1="12" x2="16" y2="12"/></svg>',
  })

  // Component type: site-header
  editor.DomComponents.addType("site-header", {
    isComponent: (el) =>
      el.getAttribute?.("data-component") === "site-header",
    model: {
      defaults: {
        tagName: "header",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { id: "simple", label: "Simple" },
              { id: "ecommerce", label: "E-commerce" },
              { id: "minimal", label: "Minimal" },
            ],
            default: "simple",
          },
        ],
      },
    },
  })

  // Component type: site-footer
  editor.DomComponents.addType("site-footer", {
    isComponent: (el) =>
      el.getAttribute?.("data-component") === "site-footer",
    model: {
      defaults: {
        tagName: "footer",
        droppable: true,
        traits: [
          {
            type: "select",
            name: "data-variant",
            label: "Variante",
            options: [
              { id: "full", label: "Complet" },
              { id: "minimal", label: "Minimal" },
            ],
            default: "full",
          },
        ],
      },
    },
  })
}
