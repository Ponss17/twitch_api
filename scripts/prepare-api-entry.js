'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'dist/backend/src');
const destDir = path.join(root, 'api/_bundle');

if (!fs.existsSync(srcDir)) {
    console.error(`[prepare-api-entry] Missing ${srcDir}. Run tsc -p tsconfig.backend.json first.`);
    process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('[prepare-api-entry] Copied backend bundle to api/_bundle');
