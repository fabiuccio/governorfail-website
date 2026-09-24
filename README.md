# Govern or Fail — governorfail.com

Companion site for the book *Govern or Fail: A Diagnostic Field Report on
Enterprise AI Governance* by Fabio Aulico (Guardrail Press). Published
**September 2026**, paperback ISBN 979-8-182350-49-5.

Static output, no server runtime, no database. A tiny Node build step copies the
hand-authored pages and renders the essays, RSS, and sitemap into a self-contained
**`dist/`** folder. Deploy `dist/` to Vercel (configured) or any static host.

## The editorial standard

The book's credibility rests on evidential restraint — the distinction between
governance *described* and governance *demonstrated*. The site is held to the
same standard: **any claim on the site that is stronger than the book is a
defect.** The manuscript (`manuscript/`, gitignored, not deployed) is the source
of truth for source notes, the glossary, the author bio, chapter titles, and any
quoted or paraphrased claim.

Three specific consequences, because they have each been got wrong before:

- Terms the book does not use do not appear on the site. The book says
  *technology provider*, never *vendor*; there is no such thing as "value
  velocity" — the Chapter 5 axes are **governance discipline** and **production
  value**.
- The Debt Quadrant is a **self-reflection exercise**, not an assessment, score,
  audit, or validated instrument. The book calls the quadrant "a diagnostic lens
  for portfolio decisions, not a maturity model or scoring method", and the page
  says so in those terms.
- Numbers carry the book's qualifiers and attribution. If a figure appears on the
  site, it appears in the book with the same hedge and the same named source.

## Layout

Source (edit these):

```
index.html              Home (book positioning, retailer CTAs, resources, email)
404.html                Custom not-found page in site chrome
resources/              /resources — the companion instruments the book promises
quadrant/               /quadrant — the Debt Quadrant self-reflection exercise
download/               /download — noindex router: ?q=<position> -> matching PDF
updates/                /updates — regulatory position, errata, changelog, versions
vocabulary/             /vocabulary — Appendix B glossary (with DefinedTermSet)
privacy/                /privacy — GDPR / nFADP policy
contact/                /contact
source-notes.html       The book's Source Notes, verbatim (40 notes)
styles.css              All styling
partials/signup-form.html   Canonical email form (generic; single source for the ESP)
content/essays/*.md     Essay source (Markdown + YAML frontmatter)
build.mjs               Copies static pages + renders essays/rss/sitemap into dist/
scripts/test-quadrant.mjs   Scorer tests (npm test)
scripts/test-scenario.mjs   Chapter 11 model tests (npm test)
scripts/generate-og.mjs Generates assets/og-default.png + og-quadrant.png
scripts/fetch-fonts.mjs Downloads + self-hosts the webfonts (GDPR / no CDN)
scripts/serve.mjs       Local preview server for dist/
docs/                   Internal notes. NEVER copied into dist/.
downloads/q-7f3a9c/     Private PDF delivery (unlinked, robots-disallowed)
manuscript/             Source manuscript. Gitignored except chapter_four.pdf,
                        which is published as /sample/chapter-four.pdf.
assets/                 Cover, OG images, fonts, favicon, quadrant.js, scenario.js,
                        download.js, signup.js
vercel.json             Vercel build config + security headers
```

Generated (do not edit, gitignored): **`dist/`** — the deployable site, built by
`npm run build`. Essays land at `dist/essays/<slug>/`.

**The build uses an explicit allowlist** (`STATIC_FILES` / `STATIC_DIRS` in
`build.mjs`) and additionally filters `*.md` out of every copied directory. Both
matter: a `README.md` inside `downloads/` was previously served publicly and
listed every "unguessable" PDF path. Internal notes belong in `docs/`, which is
not on the allowlist at all.

## Build, test & preview

```bash
npm install
npm test           # scorer + scenario model tests (no framework, no deps)
npm run dev        # build (incl. drafts) + preview at http://localhost:4321
# or, separately:
npm run build      # build production dist/ (drafts excluded)
npm run serve      # serve the built dist/ at http://localhost:4321
```

**Do not open `index.html` directly (file://).** The pages use root-absolute
paths (`/styles.css`, `/assets/…`), which the `file://` scheme resolves to your
drive root, so the page loads unstyled. Always preview through `npm run dev` /
`npm run serve`, which serves like a real host, including the custom 404.

## Deploy (Vercel)

`vercel.json` is committed: build command `npm run build`, output directory
`dist`. Connect the repo in Vercel and it builds on every push — Vercel installs
deps, runs the build, and serves **only `dist/`**, so `build.mjs`, `content/`,
`partials/`, `scripts/`, `docs/`, `manuscript/`, and any drafts are never
exposed. `dist/` is gitignored; you do not commit it.

### Security headers

`vercel.json` sets a CSP plus `Referrer-Policy`, `X-Content-Type-Options`,
`X-Frame-Options` and `Permissions-Policy`. The CSP was built from an inventory
of the origins the site actually uses:

| Directive | Value | Why |
|---|---|---|
| `default-src` | `'self'` | Everything is self-hosted, fonts included. |
| `script-src` | `'self'` | No third-party or inline JS. JSON-LD blocks are data, not script, and are not blocked. |
| `style-src` | `'self' 'unsafe-inline'` | **Required.** The quadrant progress bar sets `style="width:N%"` dynamically, and several pages use inline `style` attributes for spacing. |
| `img-src` | `'self' data:` | Local images; `data:` for any inline SVG use. |
| `font-src` | `'self'` | Fonts are self-hosted — see below. |
| `connect-src` | `'self' https://app.kit.com` | `signup.js` and `quadrant.js` POST to Kit; Vercel Analytics beacons same-origin. |
| `form-action` | `'self' https://app.kit.com` | The no-JS form POST goes straight to Kit. |
| `frame-ancestors` | `'none'` | Nothing should frame this site. |

Amazon retailer links are ordinary `<a>` navigations and need no directive.
**If you change ESP, change `connect-src` and `form-action` too** or signups will
fail silently.

## Email capture (swap the ESP)

Forms post **email only** to **Kit form 9650426**
(`https://app.kit.com/forms/9650426/subscriptions`), using our own on-brand
markup rather than Kit's rendered embed. The action URL appears in four places —
change all four to move providers, plus the two CSP directives above:

- `index.html` (the `#signup` form)
- `partials/signup-form.html` (canonical copy — used at the foot of every essay)
- `quadrant/index.html` (the no-JS fallback form)
- `assets/quadrant.js` (the `KIT_ACTION` constant — the result-screen form)

### How delivery actually works

`assets/signup.js` POSTs to Kit in the background, reveals the inline
`.signup-success` line, then navigates to **`/download/`** (trailing slash —
`vercel.json` sets `trailingSlash: true`, so `/download` would cost a 308 on
every signup). The result screen in `quadrant.js` does the same but delivers the
matching edition in place without navigating.

**The download does not wait on the confirmation email.** Form copy says "Your
download starts straight away; the confirmation email is to join the list",
because that is what happens. Do not reintroduce copy implying the file arrives
after double opt-in — Kit's double opt-in still governs list membership, but it
does not gate the PDF.

The result-screen form additionally posts hidden fields
`fields[quadrant_result]`, `fields[quadrant_belief]`, `fields[quadrant_gap]`. In
Kit, create matching custom fields (or map them to tags) so segments and
automation can read them.

### Deliberate trade-off: `mode: 'no-cors'`

Kit's form endpoint returns no CORS headers, so the `fetch` uses
`mode: 'no-cors'` and the response is opaque. **A failed subscribe therefore
cannot be detected in the browser and fails silently** — the visitor still gets
the file. This is a chosen trade-off: withholding a download the copy has just
promised, on the basis of an error we cannot actually read, would be worse. The
cost is that subscribe failures show up only as a gap between Vercel Analytics
`/download/` hits and Kit subscriber counts. Check both occasionally.

## The Debt Quadrant exercise

`assets/quadrant.js` runs entirely client-side: scoring and the result SVG are
computed in the browser; nothing is sent until the visitor submits the email
form. Scoring is pure and exposed on `window.QuadrantDebug` — `npm test` drives
it directly.

### Position keys vs display labels

**The internal keys are stable and must not change** — they are the values
written to the Kit `quadrant_result` custom field, and existing automations read
them. Display labels come from the book's Figure 5.1 and are mapped from the keys
in `LABELS` (`assets/quadrant.js`) and `EDITIONS` (`assets/download.js`):

| Key (Kit value, PDF filename) | Display label (Figure 5.1) | Figure 5.1 action |
|---|---|---|
| `governed` | Governed value | The target |
| `reckless` | Value with exposure | Act first |
| `stagnant` | Controlled but low-value | Review |
| `dormant` | Noise or residue | Clear out |

Change labels freely. Never change keys.

### Scoring

Three self-reported sub-scores: **VIS** (estate visibility, q1–q3, 0–6), **GD**
(governance discipline, q4–q8, 0–10), **VV** (production value, q9–q10, 0–4).
Thresholds are the upper third of each range — VIS ≥ 4, GD ≥ 7, VV ≥ 3 — and are
conventions for this exercise, not validated cut-points.

**Visibility gates the higher-governance-discipline row.** Chapter 5 treats
visibility as the first control, so controls reported over an estate the
respondent cannot see are not read as demonstrated discipline across it. A
respondent scoring VIS ≤ 2 gets a visibility-gap callout regardless of where they
placed themselves. `npm test` locks this in; reverting the gate fails four checks.

## Bumping the instrument version

When the scoring, thresholds, or labels change: add a dated entry under
**Instrument versions** on `updates/index.html`, bump the version label, add a
line to the changelog on the same page, and **reissue the PDFs** (see below).

## The gated PDFs

Five PDFs live under one unguessable directory:

```
/downloads/q-7f3a9c/debt-quadrant-{reckless,stagnant,dormant,governed}.pdf
/downloads/q-7f3a9c/ai-governance-debt-quadrant-full.pdf   (fallback)
```

`/download/` (`assets/download.js`) reads `?q=<position>` and links the matching
edition; any missing or unknown value falls back to the full PDF. `/downloads/`
is disallowed in `robots.txt`, carries `X-Robots-Tag: noindex` from
`vercel.json`, `/download/` is `noindex` and out of the sitemap, and nothing is
linked publicly. **The gate is for email capture, not DRM** — paths are
deliberately not tokenised, and `/download/index.html` contains the fallback path
in its markup anyway. If a URL leaks, rename the `q-7f3a9c` directory and update
`BASE` in `assets/download.js`.

**The PDF generator is not in this repo** (the files were produced with
ReportLab). The PDFs currently on disk predate the v2.0 label change and still
carry the old one-word position names — they need regenerating against the
Figure 5.1 labels. `the-diagnostic-instruments.pdf` is present but linked from
nowhere and its contents have not been checked against the book.

## Add an essay

1. Create `content/essays/YYYY-MM-DD-your-slug.md` with frontmatter:

   ```yaml
   ---
   title: ""
   description: ""   # 150–160 chars — used for meta, OG, and the list summary
   date: 2026-07-06
   slug: "your-slug"
   draft: false      # true = hidden from the site, RSS, and sitemap
   ---
   ```

2. Write the body in Markdown. `npm run build`. Deploy.

The essay publishes at `/essays/<slug>/`, is added to the essays index,
`rss.xml`, and `sitemap.xml`, and automatically gets the site chrome, `Article`
JSON-LD, an estimated reading time, the standing book plug, and the email form.

**`marked` has no footnote support.** Cite inline with a link to
`/source-notes.html` rather than `[^1]` syntax, which renders literally.

## Social cards / OG images

`scripts/generate-og.mjs` (`npm run og`) writes two 1200×630 images:
`assets/og-default.png` (site default) and `assets/og-quadrant.png` (the
`/quadrant` card). Palette and copy are constants at the top of the script.
**Both currently carry pre-v2.0 quadrant wording and should be regenerated.**

## Fonts

Fonts are **self-hosted** (`assets/fonts/`), not loaded from Google's CDN —
better performance and no leaking of visitor IPs to Google (a GDPR concern for
the EU audience). `scripts/fetch-fonts.mjs` re-downloads them and regenerates
`assets/fonts/fonts.css`; run it only if the weights in use change. The Archivo
800 face used by the hero `h1` is preloaded in every `<head>`.

## Analytics

Vercel Web Analytics (cookieless — no consent banner, no token in the markup).
Every page includes `<script defer src="/_vercel/insights/script.js"></script>`;
just turn on **Web Analytics** in the Vercel project → Analytics tab. (On a
non-Vercel host, remove that script and drop in your own cookieless analytics.)

## Open items

- [ ] Fill `{{PUBLICATION_DATE_ISO}}` and `{{PAGE_COUNT}}` in the home-page Book
      JSON-LD.
- [ ] Regenerate the five gated PDFs with the Figure 5.1 labels.
- [ ] Regenerate the OG images with the current quadrant wording.
- [ ] Decide what to do with `the-diagnostic-instruments.pdf`.
- [ ] Confirm double opt-in is enabled on the Kit form, and that the
      `quadrant_result` / `quadrant_belief` / `quadrant_gap` custom fields exist.
- [ ] Enable Web Analytics in the Vercel project.
