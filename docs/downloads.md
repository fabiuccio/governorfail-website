# /downloads

Private delivery directory for the lead-magnet PDFs. **Not linked anywhere on the
public site** and disallowed in `robots.txt`, so it is not crawled or indexed.

The files live under an unguessable slug directory so the URLs cannot be guessed
from the site structure:

```
/downloads/q-7f3a9c/debt-quadrant-reckless.pdf
/downloads/q-7f3a9c/debt-quadrant-stagnant.pdf
/downloads/q-7f3a9c/debt-quadrant-dormant.pdf
/downloads/q-7f3a9c/debt-quadrant-governed.pdf
/downloads/q-7f3a9c/ai-governance-debt-quadrant-full.pdf   (fallback / full instrument)
```

`/download` (the public router page) reads `?q=<position>` and links the matching
edition, falling back to the full PDF for missing/unknown values. The `q-7f3a9c`
segment is what keeps the files unguessable — do not simplify it and do not add a
public link. The gate exists for email capture, not DRM: the paths are
deliberately not tokenised. Regenerate the slug (and update `assets/download.js`)
if a URL is ever leaked.
