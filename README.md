# Govern or Fail — governorfail.com

Companion site for the book *Govern or Fail: Why Enterprise AI Fails After the
Demo* by Fabio Aulico (Guardrail Press, launching **September 2026**).

Static output, no server runtime, no database. A tiny Node build step copies the
hand-authored pages and renders the essays, RSS, and sitemap into a self-contained
**`dist/`** folder. Deploy `dist/` to Vercel (configured) or any static host.

## Layout

Source (edit these):

```
index.html              Home (positioning + assessment CTA + secondary email form)
quadrant/               /quadrant — interactive self-assessment (LinkedIn destination)
download/               /download — noindex router: ?q=<position> -> matching PDF
updates/                /updates — regulatory timeline, errata, instrument versions
privacy/                /privacy — GDPR / nFADP policy
contact/                /contact
source-notes.html       The 43 book references
styles.css              All styling
partials/signup-form.html   Canonical email form (generic; single source for the ESP)
content/essays/*.md     Essay source (Markdown + YAML frontmatter)
build.mjs               Copies static pages + renders essays/rss/sitemap into dist/
scripts/generate-og.mjs Generates assets/og-default.png + og-quadrant.png
scripts/fetch-fonts.mjs Downloads + self-hosts the webfonts (GDPR / no CDN)
scripts/serve.mjs       Local preview server for dist/ (clean URLs)
downloads/q-7f3a9c/     Private PDF delivery (unlinked, robots-disallowed)
assets/                 Cover, OG images, fonts, quadrant.js, download.js, signup.js
vercel.json             Vercel build config (build -> dist/)
```

The **Quadrant assessment** (`assets/quadrant.js`) runs entirely client-side:
scoring and the result SVG are computed in the browser; nothing is sent until the
visitor submits the email gate. Scoring is pure and exposed on `window.QuadrantDebug`
for testing.

Generated (do not edit, gitignored): **`dist/`** — the deployable site, built by
`npm run build`. Essays land at `dist/essays/<slug>/`.

## Build & preview

```bash
npm install
npm run dev        # build (incl. drafts) + preview at http://localhost:4321
# or, separately:
npm run build      # build production dist/ (drafts excluded)
npm run serve      # serve the built dist/ at http://localhost:4321
```

**Do not open `index.html` directly (file://).** The pages use root-absolute
paths (`/styles.css`, `/assets/…`), which the `file://` scheme resolves to your
drive root, so the page loads unstyled. Always preview through `npm run dev` /
`npm run serve`, which serves like a real host.

## Deploy (Vercel)

`vercel.json` is committed: build command `npm run build`, output directory
`dist`. Connect the repo in Vercel and it builds on every push — Vercel installs
deps, runs the build, and serves **only `dist/`**, so `build.mjs`, `content/`,
`partials/`, `scripts/`, and any drafts are never exposed. `dist/` is gitignored;
you do not commit it. Enable **Web Analytics** in the Vercel project (see below).

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

The essay publishes at `/essays/<slug>/`, is added to the essays index, `rss.xml`,
and `sitemap.xml`, and automatically gets the site chrome, an estimated reading
time, the standing book plug, and the email form. `content/essays/2026-07-06-format-example.md`
is a `draft` that documents the format — delete it when the first real essay ships.

## Email capture (swap the ESP)

Forms post **email only** to **Kit form 9650426**
(`https://app.kit.com/forms/9650426/subscriptions`), our own on-brand markup rather
than Kit's rendered embed. The action URL appears in four places — change all four
to move providers:

- `index.html` (the `#signup` secondary form)
- `partials/signup-form.html` (canonical copy — used at the foot of every essay)
- `quadrant/index.html` (the no-JS fallback form)
- `assets/quadrant.js` (the `KIT_ACTION` constant — the result-screen gate)

The result-screen gate additionally posts hidden fields `fields[quadrant_result]`,
`fields[quadrant_belief]`, `fields[quadrant_gap]`. In Kit, create matching custom
fields (or map them to tags) so segments/automation can read them. Enable
**double opt-in**, and set the single free automation's welcome email to link:

```
https://governorfail.com/download?q={{ subscriber.quadrant_result }}
```

(Verify Kit's exact merge-tag/custom-field syntax in the email editor.) Direct
home-page signups have no result, so the tag renders empty and `/download` serves
the full instrument. To move to another provider, change the four `action`/`KIT_ACTION`
values and the field names; the progressive-enhancement UX is in `assets/signup.js`
and (for the gate) `assets/quadrant.js`.

## Lead magnet (the PDFs)

Five PDFs live under one unguessable directory:

```
/downloads/q-7f3a9c/debt-quadrant-{reckless,stagnant,dormant,governed}.pdf
/downloads/q-7f3a9c/ai-governance-debt-quadrant-full.pdf   (fallback)
```

`/download` (`assets/download.js`) reads `?q=<position>` and links the matching
edition; any missing/unknown value falls back to the full PDF. `/downloads/` is
disallowed in `robots.txt`, `/download` is `noindex` and out of the sitemap, and
nothing is linked publicly. The gate is for email capture, not DRM — paths are
deliberately not tokenised. If a URL leaks, rename the `q-7f3a9c` dir and update
`BASE` in `assets/download.js`.

## Bumping the instrument version

When the Quadrant scoring/thresholds change, add a dated entry under
**Instrument versions** on `updates/index.html` and bump the `v1.x` label.

## Social cards / OG images

`scripts/generate-og.mjs` (`npm run og`) writes two 1200×630 images:
`assets/og-default.png` (site default) and `assets/og-quadrant.png` (the /quadrant
LinkedIn card, featuring the quadrant graphic). Palette/copy are constants at the
top of the script. Most pages point `og:image` at the default; `/quadrant` uses the
quadrant card. Both are absolute URLs on `https://governorfail.com`.

## Fonts

Fonts are **self-hosted** (`assets/fonts/`), not loaded from Google's CDN — better
performance and no leaking of visitor IPs to Google (a GDPR concern for the EU
audience). `scripts/fetch-fonts.mjs` re-downloads them and regenerates
`assets/fonts/fonts.css`; run it only if the weights in use change.

## Analytics

Vercel Web Analytics (cookieless — no consent banner, no token in the markup).
Every page includes `<script defer src="/_vercel/insights/script.js"></script>`;
just turn on **Web Analytics** in the Vercel project → Analytics tab. Nothing else
to configure. (On a non-Vercel host, remove that script and drop in your own
cookieless analytics.)

## Before launch — checklist

- [x] Kit form 9650426 wired into all four forms.
- [ ] Confirm double opt-in is enabled on the Kit form.
- [ ] Create Kit custom fields `quadrant_result` / `quadrant_belief` / `quadrant_gap`
      and set the welcome email's download link to `/download?q={{ ... }}`.
- [ ] Verify the flow: a `reckless` test signup's email opens `/download` showing the
      Reckless edition; a home-page signup lands on the fallback; `?q=garbage` → fallback.
- [ ] Enable Web Analytics in the Vercel project.
- [ ] At launch, when the book is on sale, add the retailer "Buy" link to the nav
      and CTAs (currently "Launching September 2026").
