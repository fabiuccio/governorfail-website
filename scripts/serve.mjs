/* Minimal static server for local preview with clean-URL support.
   Serves the built dist/ folder, so run the build first:
     npm run build && npm run serve   (or just: npm run dev)
   then open http://localhost:4321. Resolves /foo/ -> /foo/index.html and
   /foo -> /foo/index.html, mirroring how Vercel serves the static output. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'dist');
const PORT = process.env.PORT || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.md': 'text/plain; charset=utf-8'
};

// Everything served must resolve inside dist/. Without this, a request for
// /../../secrets would path.join its way out of the root.
const ROOT_PREFIX = path.resolve(ROOT) + path.sep;
function contained(p) {
  const full = path.resolve(p);
  return full === path.resolve(ROOT) || full.startsWith(ROOT_PREFIX);
}

async function resolve(urlPath) {
  let clean;
  try {
    clean = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null; // malformed percent-encoding
  }
  if (clean.includes('\0')) return null;

  const candidates = [];
  const base = path.join(ROOT, clean);
  candidates.push(base);
  if (clean.endsWith('/')) candidates.push(path.join(base, 'index.html'));
  else {
    candidates.push(base + '.html');
    candidates.push(path.join(base, 'index.html'));
  }
  if (clean === '/') candidates.unshift(path.join(ROOT, 'index.html'));
  for (const c of candidates) {
    if (!contained(c)) continue;
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch { /* next */ }
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolve(req.url);
  if (!file) {
    // Mirror the host: serve the custom 404 page with a 404 status.
    try {
      const notFound = await readFile(path.join(ROOT, '404.html'));
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      res.end(notFound);
    } catch {
      res.writeHead(404, { 'Content-Type': TYPES['.txt'] });
      res.end('Not found');
    }
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(body);
}).listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}`));
