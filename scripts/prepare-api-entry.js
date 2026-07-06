'use strict';

const fs = require('node:fs');
const path = require('node:path');

const entry = path.join(__dirname, '..', 'api', '_bundle', 'serverless.js');

if (!fs.existsSync(entry)) {
    console.error(`[prepare-api-entry] Missing ${entry}. Run tsc -p tsconfig.backend.json first.`);
    process.exit(1);
}

console.log('[prepare-api-entry] Backend bundle ready at api/_bundle');
