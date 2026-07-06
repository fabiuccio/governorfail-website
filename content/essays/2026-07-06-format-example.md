---
title: The Essay Format
description: A draft placeholder that documents how essays are authored, structured, and built for governorfail.com — not published, delete when the first real essay ships.
date: 2026-07-06
slug: format-example
draft: true
---

This file is a **draft** (`draft: true`), so it never appears in the essays index,
the RSS feed, or the sitemap, and the production build skips it entirely. It exists
to document the format. Delete it when the first real essay is ready.

## How to write one

Create a Markdown file in `content/essays/`. Name it `YYYY-MM-DD-a-slug.md`. Fill in
the frontmatter at the top:

- `title` — the essay title, used in the page `<h1>`, `<title>`, and OG tags.
- `description` — 150–160 characters. Reused for the meta description, the OG/Twitter
  description, and the summary on the essays list page. Write it deliberately.
- `date` — `YYYY-MM-DD`. Controls ordering (newest first) and the RSS `pubDate`.
- `slug` — the URL segment. The essay publishes at `/essays/<slug>/`.
- `draft` — `true` hides it from the public build; set `false` to publish.

## What you can use

Standard Markdown works: headings, **bold**, *italic*, [links](/instruments/),
lists, and blockquotes.

> Governance you can describe is not the same as governance you can demonstrate.

Then run `npm run build` and deploy. The build wraps this content in the site's
header, footer, and styles, computes an estimated reading time, and appends the
standing book plug and email form automatically.
