/* Generates the social-share images (1200x630):
     assets/og-default.png    — site-wide default
     assets/og-quadrant.png   — /quadrant (the LinkedIn asset, shows the quadrant)
   Run: node scripts/generate-og.mjs  (or: npm run og)

   Text is rasterised with a registered font so rendering is deterministic. */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const W = 1200, H = 630;
const BG = '#2B2B2B', ACCENT = '#D99A2B', CREAM = '#F3EDDE', MUTED = '#B9B4A8', CHARCOAL = '#2B2B2B', GREY = '#5A5A5A';

// ---- fonts -----------------------------------------------------------------
async function exists(p) { try { await access(p); return true; } catch { return false; } }
async function registerFirst(cands, family) {
  for (const p of cands) if (await exists(p)) { try { GlobalFonts.registerFromPath(p, family); return true; } catch {} }
  return false;
}
const haveSerif = await registerFirst([
  path.join(ROOT, 'scripts', 'fonts', 'serif-bold.ttf'),
  'C:\\Windows\\Fonts\\georgiab.ttf', 'C:\\Windows\\Fonts\\georgia.ttf',
  '/System/Library/Fonts/Supplemental/Georgia Bold.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
], 'OG Serif');
const haveSans = await registerFirst([
  'C:\\Windows\\Fonts\\arial.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
], 'OG Sans');
const serif = haveSerif ? 'OG Serif' : 'serif';
const sans = haveSans ? 'OG Sans' : 'sans-serif';

function spaced(ctx, text, x, y, ls) {
  let cx = x;
  for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + ls; }
}
function wrap(ctx, text, maxWidth) {
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// ---- default card ----------------------------------------------------------
function renderDefault() {
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ACCENT; ctx.fillRect(0, 0, 12, H);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ACCENT; ctx.font = `500 24px "${sans}"`;
  spaced(ctx, 'GUARDRAIL PRESS · FIELD REPORT N°01', 90, 150, 3);
  ctx.font = `bold 112px "${serif}"`;
  ctx.fillStyle = CREAM; ctx.fillText('Govern or ', 90, 360);
  const w1 = ctx.measureText('Govern or ').width;
  ctx.fillStyle = ACCENT; ctx.fillText('Fail', 90 + w1, 360);
  ctx.fillStyle = ACCENT; ctx.fillRect(90, 394, 120, 5);
  ctx.fillStyle = MUTED; ctx.font = `500 34px "${sans}"`;
  ctx.fillText('Enterprise AI Governance', 90, 470);
  ctx.font = `400 26px "${sans}"`;
  ctx.fillText('Fabio Aulico · governorfail.com', 90, H - 70);
  return c.toBuffer('image/png');
}

// ---- quadrant card ---------------------------------------------------------
function renderQuadrant() {
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ACCENT; ctx.fillRect(0, 0, 12, H);
  ctx.textBaseline = 'alphabetic';

  // left column text
  ctx.fillStyle = ACCENT; ctx.font = `500 22px "${sans}"`;
  spaced(ctx, 'THE GOVERNANCE DEBT QUADRANT', 80, 130, 2);
  ctx.fillStyle = CREAM; ctx.font = `bold 60px "${serif}"`;
  const lines = wrap(ctx, 'Where does your AI estate actually stand?', 560);
  let ty = 230;
  for (const ln of lines) { ctx.fillText(ln, 80, ty); ty += 70; }
  ctx.fillStyle = MUTED; ctx.font = `400 27px "${sans}"`;
  ctx.fillText('Ten questions. Three minutes. Free.', 80, ty + 18);
  ctx.fillStyle = MUTED; ctx.font = `400 24px "${sans}"`;
  ctx.fillText('Fabio Aulico · governorfail.com', 80, H - 60);

  // right: cream card with the quadrant
  const cardX = 720, cardY = 95, cardW = 400, cardH = 400;
  ctx.fillStyle = CREAM; ctx.fillRect(cardX, cardY, cardW, cardH);
  const px = cardX + 55, py = cardY + 45, pw = 300, ph = 270; // plot area
  ctx.strokeStyle = CHARCOAL; ctx.lineWidth = 1.5;
  ctx.strokeRect(px, py, pw, ph);
  ctx.strokeStyle = '#D9CFBE';
  ctx.beginPath(); ctx.moveTo(px + pw / 2, py); ctx.lineTo(px + pw / 2, py + ph); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke();
  // corner labels
  ctx.fillStyle = CHARCOAL; ctx.font = `bold 15px "${sans}"`;
  ctx.textAlign = 'right'; ctx.fillText('GOVERNED', px + pw - 8, py + 22);
  ctx.textAlign = 'left'; ctx.fillText('RECKLESS', px + 8, py + 22);
  ctx.textAlign = 'right'; ctx.fillText('STAGNANT', px + pw - 8, py + ph - 12);
  ctx.textAlign = 'left'; ctx.fillText('DORMANT', px + 8, py + ph - 12);
  // axis labels
  ctx.textAlign = 'center'; ctx.fillStyle = GREY; ctx.font = `bold 12px "${sans}"`;
  ctx.fillText('GOVERNANCE DISCIPLINE', px + pw / 2, py + ph + 30);
  ctx.save();
  ctx.translate(cardX + 24, py + ph / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('VALUE VELOCITY', 0, 0); ctx.restore();
  // amber dot (illustrative: reckless quadrant)
  ctx.textAlign = 'left';
  ctx.fillStyle = ACCENT; ctx.strokeStyle = CHARCOAL; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(px + pw * 0.25, py + ph * 0.28, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  return c.toBuffer('image/png');
}

await writeFile(path.join(ROOT, 'assets', 'og-default.png'), renderDefault());
await writeFile(path.join(ROOT, 'assets', 'og-quadrant.png'), renderQuadrant());
console.log(`Wrote assets/og-default.png and assets/og-quadrant.png (${W}x${H}). serif=${serif}, sans=${sans}`);
