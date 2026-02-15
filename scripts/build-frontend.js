const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../frontend');
const OUT_DIR = path.join(__dirname, '../public/js');

function getEntryPoints(dir) {
    let entries = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            if (file !== 'vendor' && file !== 'types') {
                entries = entries.concat(getEntryPoints(filePath));
            }
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            entries.push(filePath);
        }
    });

    return entries;
}

async function build() {
    console.log('🚀 Iniciando build de Frontend con Esbuild...');

    const entryPoints = getEntryPoints(SRC_DIR);

    console.log(`📂 Encontrados ${entryPoints.length} archivos TypeScript.`);

    try {
        await esbuild.build({
            entryPoints: entryPoints,
            outdir: OUT_DIR,
            bundle: false,
            minify: false,
            sourcemap: false,
            target: ['es2020'],
            platform: 'browser',
            format: 'esm',
        });

        console.log('✅ Build completado exitosamente en public/js/');
    } catch (e) {
        console.error('❌ Error en el build:', e);
        process.exit(1);
    }
}

build();
