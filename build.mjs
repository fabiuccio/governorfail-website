/* Static build for governorfail.com. Emits a self-contained dist/:
   - copies the book homepage, vocabulary, shared styles/assets, and robots.txt,
   - renders essays from content/essays/*.md into prerendered HTML plus the essays
     index, RSS feed, and sitemap.
   Source files (this script, content/, partials/, scripts/) are never copied, so
   deploying dist/ never exposes them.

   Usage:
     node build.mjs            # production: drafts excluded
     node build.mjs --drafts   # include drafts (local preview only)
*/
import { readdir, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { marked } from 'marked';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://governorfail.com';
const INCLUDE_DRAFTS = process.argv.includes('--drafts');

// ---- shared chrome (kept identical to the hand-authored pages) -------------

// Retailer link for the "Get the book" call to action, used in the nav and the
// standing book plug at the foot of every essay.
const BUY_URL = 'https://www.amazon.com/Govern-Fail-Diagnostic-Enterprise-Governance/dp/B0HHY4JVRV/ref=tmm_pap_swatch_0';

const NAV = `  <header class="site-header">
    <nav class="site-nav wrap" aria-label="Main">
      <a class="logo" href="/"><span class="diamond" aria-hidden="true">◇</span>Govern or Fail</a>
      <div class="nav-links">
        <a href="/#book">Book</a>
        <a href="/essays/">Essays</a>
        <a href="/vocabulary/">Vocabulary</a>
        <a class="btn-buy" href="${BUY_URL}">Get the book</a>
      </div>
    </nav>
  </header>`;

const FOOTER = `  <footer class="site-footer">
    <div class="footer-inner wrap">
      <div class="footer-id">
        <p class="footer-logo"><span class="diamond" aria-hidden="true">◇</span>Govern or Fail</p>
        <p class="footer-sub">A Diagnostic Field Report on Enterprise AI Governance</p>
        <p>© 2026 Fabio Aulico. All rights reserved.</p>
        <p>Guardrail Press</p>
        <p class="footer-views">The views expressed are the author's own.</p>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <a href="/#book">Book</a>
        <a href="/essays/">Essays</a>
        <a href="/vocabulary/">Vocabulary</a>
      </nav>
    </div>
  </footer>`;

const ANALYTICS = `  <!-- Vercel Web Analytics (cookieless, no consent banner). Enable Web Analytics in the Vercel project settings. -->
  <script defer src="/_vercel/insights/script.js"></script>`;

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function layout({ title, description, canonical, ogType = 'website', content, jsonLd = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">

  <meta property="og:site_name" content="Govern or Fail">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:image" content="${SITE}/assets/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}/assets/og-default.png">

  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="Govern or Fail — Essays" href="/essays/rss.xml">
  <link rel="preload" href="/assets/fonts/archivo-800-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/styles.css">
${jsonLd}</head>
<body id="top">

  <a class="skip-link" href="#main">Skip to content</a>

${NAV}

  <main id="main">
${content}
  </main>

${FOOTER}

${ANALYTICS}

</body>
</html>
`;
}

// ---- frontmatter + essays --------------------------------------------------

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*?)\s*$/);
    if (!kv) continue;
    const rawVal = kv[2].replace(/\r$/, '');
    let val;
    if (rawVal.startsWith('"') && rawVal.endsWith('"') && rawVal.length >= 2) {
      // double-quoted: unescape \" and \\
      val = rawVal.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } else if (rawVal.startsWith("'") && rawVal.endsWith("'") && rawVal.length >= 2) {
      // single-quoted: '' is a literal '
      val = rawVal.slice(1, -1).replace(/''/g, "'");
    } else {
      val = rawVal;
    }
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    data[kv[1]] = val;
  }
  return { data, body: m[2] };
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function readingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function loadEssays() {
  const dir = path.join(ROOT, 'content', 'essays');
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  const essays = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug || file.replace(/\.md$/, '');
    essays.push({
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || '1970-01-01',
      draft: data.draft === true,
      body,
      readingTime: readingTime(body.replace(/[#>*_`\-]/g, ' '))
    });
  }
  essays.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  return essays;
}

// ---- renderers -------------------------------------------------------------

function essayPage(essay) {
  const canonical = `${SITE}/essays/${essay.slug}/`;
  const content = `    <article class="section-pad wrap article">
      <a class="back-link" href="/essays/"><span aria-hidden="true">←</span> All essays</a>
      <p class="e-meta">${esc(formatDate(essay.date))} · ${essay.readingTime} min read · Fabio Aulico</p>
      <h1 class="article-title">${esc(essay.title)}</h1>
      <div class="article-body">
${marked.parse(essay.body)}
      </div>
      <div class="essay-standing">
        <p class="plug"><em class="title-ref">Govern or Fail</em> — a diagnostic field report on enterprise AI governance, out now from Guardrail Press. <a href="${BUY_URL}">Get the book →</a></p>
      </div>
    </article>`;
  const jsonLd = `  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: essay.title,
    description: essay.description,
    datePublished: essay.date,
    dateModified: essay.date,
    inLanguage: 'en',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    url: canonical,
    image: `${SITE}/assets/og-default.png`,
    author: { '@type': 'Person', name: 'Fabio Aulico' },
    publisher: { '@type': 'Organization', name: 'Guardrail Press' },
    isPartOf: { '@type': 'Blog', name: 'Govern or Fail — Essays', url: `${SITE}/essays/` }
  }, null, 2).split('\n').join('\n  ')}
  </script>
`;
  return layout({
    title: `${essay.title} | Govern or Fail`,
    description: essay.description,
    canonical,
    ogType: 'article',
    content,
    jsonLd
  });
}

function essaysIndex(essays) {
  const items = essays.length
    ? `        <ul class="essay-list">
${essays
  .map(
    (e) => `          <li>
            <span class="e-date">${esc(formatDate(e.date))} · ${e.readingTime} min read</span>
            <h2><a href="/essays/${e.slug}/">${esc(e.title)}</a></h2>
            <p>${esc(e.description)}</p>
          </li>`
  )
  .join('\n')}
        </ul>`
    : `        <p class="essay-empty">No essays published yet.</p>`;

  const content = `    <section>
      <div class="section-pad wrap notes-hero">
        <a class="back-link" href="/"><span aria-hidden="true">←</span> Back to the book</a>
        <p class="kicker">Essays</p>
        <h1 class="section-title">Essays</h1>
        <p class="notes-intro">Notes from the same territory as the book — where enterprise AI ambition meets organisational control. <a href="/essays/rss.xml">RSS</a>.</p>
      </div>
    </section>
    <section>
      <div class="section-pad wrap" style="padding-top: 0;">
${items}
      </div>
    </section>`;
  return layout({
    title: 'Essays | Govern or Fail',
    description: 'Essays on enterprise AI governance by Fabio Aulico, author of Govern or Fail.',
    canonical: `${SITE}/essays/`,
    content
  });
}

function rss(essays) {
  const now = new Date().toUTCString();
  const items = essays
    .map(
      (e) => `    <item>
      <title>${esc(e.title)}</title>
      <link>${SITE}/essays/${e.slug}/</link>
      <guid isPermaLink="true">${SITE}/essays/${e.slug}/</guid>
      <pubDate>${new Date(e.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <description>${esc(e.description)}</description>
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Govern or Fail — Essays</title>
    <link>${SITE}/essays/</link>
    <atom:link href="${SITE}/essays/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Essays on enterprise AI governance by Fabio Aulico.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

function sitemap(essays) {
  const staticUrls = [
    `${SITE}/`,
    `${SITE}/essays/`,
    `${SITE}/vocabulary/`
  ];
  const urls = [...staticUrls, ...essays.map((e) => `${SITE}/essays/${e.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
}

// ---- run -------------------------------------------------------------------

const all = await loadEssays();
const published = all.filter((e) => INCLUDE_DRAFTS || !e.draft);

// Fresh, self-contained output directory. Only this is deployed, so source
// files (build.mjs, content/, partials/, scripts/, drafts) are never served.
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

// Copy the hand-authored static site into dist (explicit allowlist).
// Documentation lives in docs/ and is never copied. Markdown is filtered out of
// every copied directory as a second line of defence: a stray README inside
// downloads/ would otherwise be publicly served and would list the PDF paths.
const STATIC_FILES = [
  'index.html', '404.html', 'styles.css', 'robots.txt',
  'assets/favicon.svg', 'assets/og-default.png',
  'assets/Govern-or-Fail_ebook_1600x2560.png'
];
const STATIC_DIRS = ['assets/fonts', 'vocabulary'];
const noMarkdown = (src) => !src.toLowerCase().endsWith('.md');
await mkdir(path.join(DIST, 'assets'), { recursive: true });
for (const f of STATIC_FILES) {
  await cp(path.join(ROOT, f), path.join(DIST, f));
}
for (const d of STATIC_DIRS) {
  await cp(path.join(ROOT, d), path.join(DIST, d), { recursive: true, filter: noMarkdown });
}

// Publish the book extract without exposing the rest of the manuscript folder.
await mkdir(path.join(DIST, 'sample'), { recursive: true });
await cp(
  path.join(ROOT, 'manuscript', 'chapter_four.pdf'),
  path.join(DIST, 'sample', 'chapter-four.pdf')
);

// Generated essays + feeds.
await mkdir(path.join(DIST, 'essays'), { recursive: true });
for (const essay of published) {
  const outDir = path.join(DIST, 'essays', essay.slug);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), essayPage(essay));
}
await writeFile(path.join(DIST, 'essays', 'index.html'), essaysIndex(published));
await writeFile(path.join(DIST, 'essays', 'rss.xml'), rss(published));
await writeFile(path.join(DIST, 'sitemap.xml'), sitemap(published));

console.log(
  `Built dist/ — ${published.length} essay${published.length === 1 ? '' : 's'}` +
    `${INCLUDE_DRAFTS ? ' (drafts included)' : ''}, essays index, rss.xml, sitemap.xml, ` +
    `plus ${STATIC_FILES.length} files and ${STATIC_DIRS.length} directories copied.`
);
