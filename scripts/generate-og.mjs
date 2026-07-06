/* Generates the default social-share image assets/og-default.png (1200x630).
   Run: node scripts/generate-og.mjs  (or: npm run og)

   Palette + copy live in the CONFIG block below so per-page variants are trivial
   later (pass different title/sub, output a different file). Text is rasterised
   with a registered font so rendering is deterministic across machines. */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const CONFIG = {
  width: 1200,
  height: 630,
  bg: '#2B2B2B', // charcoal
  accent: '#D99A2B', // warm amber
  title1: '#F3EDDE', // cream
  muted: '#B9B4A8',
  kicker: 'GUARDRAIL PRESS · FIELD REPORT N°01',
  titleA: 'Govern or ',
  titleB: 'Fail',
  sub: 'Enterprise AI Governance',
  footer: 'Fabio Aulico · governorfail.com',
  out: path.join(ROOT, 'assets', 'og-default.png')
};

// Register fonts. Prefer a bundled font if present, else fall back to common
// system serifs/sans so the script runs on Windows, macOS, and Linux CI.
async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}
async function registerFirst(candidates, family) {
  for (const p of candidates) {
    if (await exists(p)) {
      try { GlobalFonts.registerFromPath(p, family); return true; } catch { /* keep trying */ }
    }
  }
  return false;
}

const haveSerif = await registerFirst(
  [
    path.join(ROOT, 'scripts', 'fonts', 'serif-bold.ttf'),
    'C:\\Windows\\Fonts\\georgiab.ttf',
    'C:\\Windows\\Fonts\\georgia.ttf',
    '/System/Library/Fonts/Supplemental/Georgia Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
  ],
  'OG Serif'
);
const haveSans = await registerFirst(
  [
    'C:\\Windows\\Fonts\\arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
  ],
  'OG Sans'
);

const serif = haveSerif ? 'OG Serif' : 'serif';
const sans = haveSans ? 'OG Sans' : 'sans-serif';

const { width: W, height: H } = CONFIG;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
const PAD = 90;

// Background
ctx.fillStyle = CONFIG.bg;
ctx.fillRect(0, 0, W, H);

// Left accent bar
ctx.fillStyle = CONFIG.accent;
ctx.fillRect(0, 0, 12, H);

// Kicker
ctx.textBaseline = 'alphabetic';
ctx.fillStyle = CONFIG.accent;
ctx.font = `500 24px "${sans}"`;
// letter-spacing emulation
(function spaced(text, x, y, ls) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + ls;
  }
})(CONFIG.kicker, PAD, 150, 3);

// Title (two-tone)
ctx.font = `bold 112px "${serif}"`;
const titleY = 360;
ctx.fillStyle = CONFIG.title1;
ctx.fillText(CONFIG.titleA, PAD, titleY);
const aWidth = ctx.measureText(CONFIG.titleA).width;
ctx.fillStyle = CONFIG.accent;
ctx.fillText(CONFIG.titleB, PAD + aWidth, titleY);

// Amber underline under the title
ctx.fillStyle = CONFIG.accent;
ctx.fillRect(PAD, titleY + 34, 120, 5);

// Subtitle
ctx.fillStyle = CONFIG.muted;
ctx.font = `500 34px "${sans}"`;
ctx.fillText(CONFIG.sub, PAD, titleY + 110);

// Footer
ctx.fillStyle = CONFIG.muted;
ctx.font = `400 26px "${sans}"`;
ctx.fillText(CONFIG.footer, PAD, H - 70);

const buf = canvas.toBuffer('image/png');
await writeFile(CONFIG.out, buf);
console.log(
  `Wrote ${path.relative(ROOT, CONFIG.out)} (${W}x${H}). ` +
    `serif=${serif}, sans=${sans}`
);
