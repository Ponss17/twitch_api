/**
 * Ejecuta 'astro build' aislando BASE_URL del entorno para que el backend
 * (que usa BASE_URL con semántica de URL de la API) no interfiera con la base
 * del sitio estático de Astro.
 *
 * Astro usa BASE_URL si está definida, pero su valor por defecto ('/' cuando no
 * se fija `base` en astro.config) es el correcto para este proyecto.
 * Forzarla a '/' aquí garantiza que no se herede ningún valor extraño del entorno
 * de Vercel (p.ej. 'https://ttv.losperris.dev') que haría que los paths de
 * los assets se generaran como '///_astro/...' en lugar de '/_astro/'.
 */
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Heredamos el entorno completo pero sobreescribimos BASE_URL con el valor
// que Astro espera (path relativo '/', no URL absoluta).
const env = { ...process.env, BASE_URL: '/' };
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Solo artefactos regenerables. Nunca borra api/_bundle, que se compila antes.
for (const relative of ['dist', '.astro', path.join('node_modules', '.vite')]) {
    rmSync(path.join(root, relative), { recursive: true, force: true });
}

const astroBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'astro.cmd' : 'astro');
const result = spawnSync(astroBin, ['build'], {
    stdio: 'inherit',
    env,
    shell: false
});

process.exit(result.status ?? 1);

