# Govern or Fail — book website

Static site, no build step, no dependencies. Deploy this folder as-is to
Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any static host.

## Files

- `index.html` — the landing page (all copy, SEO meta, JSON-LD Book schema)
- `source-notes.html` — the source notes / references page (43 references)
- `styles.css` — all styling (palette drawn from the cover art)
- `assets/Govern-or-Fail_ebook_1600x2560.png` — ebook cover used in the hero
- `assets/social-1080.png` — Open Graph / social share image

Cover image, contact email (`hello@governorfail.com`), and source-notes links are all
wired in. The book publishes **September 2026**, so buy CTAs show an
"Available September 2026" state instead of a store link.

## Before publishing — still to do

1. **Amazon link (at launch).** When the book goes on sale, swap the four
   `<span class="btn btn-primary btn-soon">…</span>` (and the nav `btn-soon` span) for
   real `<a href="…">Buy the book</a>` links.
2. **`og:image` / `twitter:image`** — change `assets/social-1080.png` to an **absolute URL**
   once the domain is live (social crawlers need absolute URLs). Same for the
   `og:image` in `source-notes.html`.

## Deploy to Vercel

```
vercel deploy --prod
```

(or drag the folder into the Vercel dashboard — it is detected as a static site).
