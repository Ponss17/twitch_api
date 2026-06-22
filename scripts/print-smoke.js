const fs = require('fs');
const path = require('path');

const doc = path.join(__dirname, '..', 'docs', 'SMOKE-PROD.md');
console.log(fs.readFileSync(doc, 'utf8'));
