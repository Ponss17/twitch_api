import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.NODE_ENV !== 'production') {
    console.error('Production smoke must run with NODE_ENV=production.');
    process.exit(1);
}

await import('./verify-build.mjs');

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
for (const required of [
    'dist/index.html',
    'dist/dashboard/index.html',
    'api/index.js',
    'api/_bundle/serverless.js',
    'vercel.json'
]) {
    if (!fs.existsSync(path.join(root, required))) {
        console.error(`Production smoke missing ${required}`);
        process.exit(1);
    }
}

console.log('Production smoke passed.');
