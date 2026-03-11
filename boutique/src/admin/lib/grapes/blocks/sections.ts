import type { Editor } from "grapesjs"

export function registerSectionBlocks(editor: Editor) {
  const bm = editor.Blocks

  bm.add("hero", {
    label: "Hero",
    category: "Sections",
    content: `<section style="position:relative;width:100%;min-height:500px;display:flex;background:#1f2937;">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);"></div>
      <div style="position:relative;z-index:10;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;width:100%;padding:64px 24px;max-width:1280px;margin:0 auto;">
        <h1 style="font-size:48px;font-weight:700;color:#ffffff;max-width:800px;line-height:1.2;">Welcome to Our Store</h1>
        <p style="margin-top:20px;font-size:18px;color:#ffffff;opacity:0.9;max-width:600px;line-height:1.6;">Discover our latest collection of premium products</p>
        <div style="display:flex;gap:16px;margin-top:32px;flex-wrap:wrap;">
          <a href="/store" style="display:inline-block;padding:14px 32px;background:#ffffff;color:#000000;font-weight:600;border-radius:4px;text-decoration:none;">Shop Now</a>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="14" y2="14"/></svg>',
  })

  bm.add("cta", {
    label: "Call to Action",
    category: "Sections",
    content: `<section style="background:#111827;padding:64px 24px;">
      <div style="max-width:768px;margin:0 auto;text-align:center;">
        <h2 style="font-size:32px;font-weight:700;color:#ffffff;">Ready to get started?</h2>
        <p style="margin-top:16px;font-size:18px;color:#ffffff;opacity:0.85;line-height:1.6;">Join thousands of customers who trust us.</p>
        <div style="display:flex;gap:16px;margin-top:28px;justify-content:center;flex-wrap:wrap;">
          <a href="/" style="display:inline-block;padding:14px 28px;background:#ffffff;color:#111827;font-weight:600;border-radius:4px;text-decoration:none;">Get Started</a>
          <a href="/" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:600;border-radius:4px;text-decoration:none;border:2px solid #ffffff;">Learn More</a>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 15h4M8 11h8"/></svg>',
  })

  bm.add("features", {
    label: "Features",
    category: "Sections",
    content: `<section style="padding:64px 24px;background:#ffffff;">
      <div style="max-width:1280px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:48px;">
          <h2 style="font-size:32px;font-weight:700;color:#111827;">Why Choose Us</h2>
          <p style="margin-top:12px;font-size:18px;color:#6b7280;">Everything you need to succeed</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
          <div style="text-align:center;padding:16px;">
            <span style="font-size:40px;display:block;margin-bottom:16px;">🚀</span>
            <h3 style="font-size:18px;font-weight:600;color:#111827;margin-bottom:8px;">Fast Delivery</h3>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;">Get your products delivered quickly and efficiently</p>
          </div>
          <div style="text-align:center;padding:16px;">
            <span style="font-size:40px;display:block;margin-bottom:16px;">🔒</span>
            <h3 style="font-size:18px;font-weight:600;color:#111827;margin-bottom:8px;">Secure Payment</h3>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;">Your transactions are protected with enterprise-grade security</p>
          </div>
          <div style="text-align:center;padding:16px;">
            <span style="font-size:40px;display:block;margin-bottom:16px;">💬</span>
            <h3 style="font-size:18px;font-weight:600;color:#111827;margin-bottom:8px;">24/7 Support</h3>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;">Our team is here to help you anytime, anywhere</p>
          </div>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  })

  bm.add("faq", {
    label: "FAQ",
    category: "Sections",
    content: `<section style="padding:64px 24px;background:#f9fafb;">
      <div style="max-width:768px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:40px;">
          <h2 style="font-size:32px;font-weight:700;color:#111827;">Frequently Asked Questions</h2>
          <p style="margin-top:12px;font-size:18px;color:#4b5563;">Find answers to common questions</p>
        </div>
        <div style="border-top:1px solid #e5e7eb;">
          <details style="padding:20px 0;border-bottom:1px solid #e5e7eb;">
            <summary style="font-weight:600;color:#111827;cursor:pointer;list-style:none;">What is your return policy?</summary>
            <p style="margin-top:16px;color:#4b5563;line-height:1.6;">We offer a 30-day return policy on all items.</p>
          </details>
          <details style="padding:20px 0;border-bottom:1px solid #e5e7eb;">
            <summary style="font-weight:600;color:#111827;cursor:pointer;list-style:none;">How long does shipping take?</summary>
            <p style="margin-top:16px;color:#4b5563;line-height:1.6;">Standard shipping takes 3-5 business days.</p>
          </details>
          <details style="padding:20px 0;border-bottom:1px solid #e5e7eb;">
            <summary style="font-weight:600;color:#111827;cursor:pointer;list-style:none;">Do you ship internationally?</summary>
            <p style="margin-top:16px;color:#4b5563;line-height:1.6;">Yes! We ship to over 50 countries worldwide.</p>
          </details>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 015.12-2.13A3 3 0 0112 13v1M12 17h.01"/></svg>',
  })

  bm.add("image-text", {
    label: "Image & Texte",
    category: "Sections",
    content: `<section style="padding:64px 24px;">
      <div style="max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
        <div>
          <img src="https://placehold.co/600x400" alt="Image" style="width:100%;height:auto;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
        </div>
        <div>
          <h2 style="font-size:32px;font-weight:700;color:#111827;">Your Title Here</h2>
          <p style="margin-top:16px;font-size:16px;color:#4b5563;line-height:1.7;">Write a compelling description for this section. Explain your product, service, or story here.</p>
          <a href="/" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#111827;color:#ffffff;font-weight:600;border-radius:4px;text-decoration:none;">Learn More</a>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="8" height="18" rx="1"/><path d="M15 7h6M15 11h6M15 15h4"/></svg>',
  })

  bm.add("card-grid", {
    label: "Grille de cartes",
    category: "Sections",
    content: `<section style="padding:64px 24px;background:#ffffff;">
      <div style="max-width:1280px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
        <div style="background:#f9fafb;border-radius:8px;overflow:hidden;">
          <img src="https://placehold.co/400x250" alt="Card 1" style="width:100%;height:200px;object-fit:cover;" />
          <div style="padding:24px;">
            <h3 style="font-size:18px;font-weight:600;color:#111827;">Card Title</h3>
            <p style="margin-top:8px;font-size:14px;color:#6b7280;line-height:1.6;">Card description goes here.</p>
            <a href="/" style="display:inline-block;margin-top:16px;font-size:14px;font-weight:600;color:#111827;text-decoration:none;">Learn more →</a>
          </div>
        </div>
        <div style="background:#f9fafb;border-radius:8px;overflow:hidden;">
          <img src="https://placehold.co/400x250" alt="Card 2" style="width:100%;height:200px;object-fit:cover;" />
          <div style="padding:24px;">
            <h3 style="font-size:18px;font-weight:600;color:#111827;">Card Title</h3>
            <p style="margin-top:8px;font-size:14px;color:#6b7280;line-height:1.6;">Card description goes here.</p>
            <a href="/" style="display:inline-block;margin-top:16px;font-size:14px;font-weight:600;color:#111827;text-decoration:none;">Learn more →</a>
          </div>
        </div>
        <div style="background:#f9fafb;border-radius:8px;overflow:hidden;">
          <img src="https://placehold.co/400x250" alt="Card 3" style="width:100%;height:200px;object-fit:cover;" />
          <div style="padding:24px;">
            <h3 style="font-size:18px;font-weight:600;color:#111827;">Card Title</h3>
            <p style="margin-top:8px;font-size:14px;color:#6b7280;line-height:1.6;">Card description goes here.</p>
            <a href="/" style="display:inline-block;margin-top:16px;font-size:14px;font-weight:600;color:#111827;text-decoration:none;">Learn more →</a>
          </div>
        </div>
      </div>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="6" height="9" rx="1"/><rect x="9" y="3" width="6" height="9" rx="1"/><rect x="16" y="3" width="6" height="9" rx="1"/></svg>',
  })
}
