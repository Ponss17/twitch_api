const fs = require('fs');
const path = require('path');

const viteCache = path.join(__dirname, '..', 'node_modules', '.vite');

if (fs.existsSync(viteCache)) {
    fs.rmSync(viteCache, { recursive: true, force: true });
    console.log('✓ Caché de Vite eliminada (node_modules/.vite)');
} else {
    console.log('· No había caché de Vite que limpiar');
}
