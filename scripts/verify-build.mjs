import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const failures = [];

function walk(directory) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const absolute = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(absolute) : [absolute];
    });
}

const dist = path.join(root, 'dist');
const assets = walk(path.join(dist, '_astro'));
const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
// React + scheduler van juntos en vendor-react (~710 KiB); el resto se mantiene más bajo.
const jsBudgetBytes = 768 * 1024;

for (const file of assets.filter((candidate) => candidate.endsWith('.js'))) {
    const size = fs.statSync(file).size;
    if (size > jsBudgetBytes) {
        failures.push(`chunk ${path.relative(root, file)} is ${Math.ceil(size / 1024)} KiB (budget: 768 KiB)`);
    }
}

if (!assets.some((file) => file.endsWith('.js.map'))) failures.push('frontend production sourcemaps are missing');
if (!fs.existsSync(path.join(root, 'api', '_bundle', 'serverless.js.map'))) {
    failures.push('backend production sourcemap is missing');
}

for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1];
    if (!canonical) continue;
    const pathname = new URL(canonical).pathname;
    if (!pathname.endsWith('/') && !path.extname(pathname)) {
        failures.push(`${path.relative(root, file)} has non-canonical trailing slash: ${canonical}`);
    }
}

const csp = vercel.headers
    ?.flatMap((entry) => entry.headers ?? [])
    .find((header) => header.key === 'Content-Security-Policy')?.value ?? '';
for (const host of ['cdnjs.cloudflare.com', 'unpkg.com', 'cdn.jsdelivr.net']) {
    if (csp.includes(host)) failures.push(`unused CSP host remains: ${host}`);
}

const imageCache = vercel.headers?.find((entry) => entry.source === '/img/:path*')
    ?.headers?.find((header) => header.key === 'Cache-Control')?.value ?? '';
if (imageCache.includes('immutable')) failures.push('unhashed /img assets must not be immutable');
if (vercel.trailingSlash !== true) failures.push('Vercel trailingSlash must match Astro trailingSlash=always');
if (!vercel.rewrites?.some((entry) => entry.source === '/dashboard/:path*')) {
    failures.push('dashboard SPA rewrite is missing');
}

if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join('\n'));
    process.exit(1);
}

console.log(`Build verified: ${htmlFiles.length} HTML files, ${assets.length} Astro assets.`);
