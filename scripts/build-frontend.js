const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../frontend');
const ADMIN_DIR = path.join(__dirname, '../admin');
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

    // Archivos admin (solo existen localmente, en .gitignore)
    const adminEntries = [];
    if (fs.existsSync(ADMIN_DIR)) {
        fs.readdirSync(ADMIN_DIR)
            .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && f !== 'api.ts')
            .forEach((f) => adminEntries.push(path.join(ADMIN_DIR, f)));
        if (adminEntries.length) {
            console.log(`🔐 Encontrados ${adminEntries.length} archivos TypeScript de admin.`);
        }
    }

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

        const sharedConfig = {
            bundle: true,
            minify: false,
            keepNames: true,
            legalComments: 'none',
            sourcemap: false,
            target: ['es2020'],
            platform: 'browser',
            format: 'esm',
            tsconfig: path.join(__dirname, '../tsconfig.frontend.json'),
            loader: { '.ts': 'ts' },
            define: {
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
                'process.env.VERCEL': JSON.stringify(process.env.VERCEL || '1')
            }
        };

        await esbuild.build({ ...sharedConfig, entryPoints, outdir: OUT_DIR });

        if (adminEntries.length) {
            await esbuild.build({
                ...sharedConfig,
                entryPoints: adminEntries,
                outdir: path.join(OUT_DIR, 'admin')
            });
        }

        console.log('✅ Build completado exitosamente en public/js/');
    } catch (e) {
        console.error('❌ Error en el build:', e);
        process.exit(1);
    }
}

build();
