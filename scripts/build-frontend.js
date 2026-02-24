const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../frontend');
const OUT_DIR = path.join(__dirname, '../public/js');

function getEntryPoints(dir) {
    let entries = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
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
        if (fs.existsSync(OUT_DIR)) {
            console.log('🧹 Limpiando directorio public/js...');
            fs.rmSync(OUT_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(OUT_DIR, { recursive: true });

        const vendorSrc = path.join(SRC_DIR, 'vendor');
        const vendorDest = path.join(OUT_DIR, 'vendor');
        if (fs.existsSync(vendorSrc)) {
            console.log('📦 Copiando librerías vendor...');
            fs.cpSync(vendorSrc, vendorDest, { recursive: true });
        }

        await esbuild.build({
            entryPoints: entryPoints,
            outdir: OUT_DIR,
            bundle: true,
            minify: false, // Dejar false para facilitar debug si el usuario lo necesita
            keepNames: true,
            legalComments: 'none',
            sourcemap: false,
            target: ['es2020'],
            platform: 'browser',
            format: 'esm',
            tsconfig: path.join(__dirname, '../tsconfig.frontend.json'),
            loader: { '.ts': 'ts' }
        });

        console.log('✅ Build completado exitosamente en public/js/');
    } catch (e) {
        console.error('❌ Error en el build:', e);
        process.exit(1);
    }
}

build();
