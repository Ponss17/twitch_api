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

// Heredamos el entorno completo pero sobreescribimos BASE_URL con el valor
// que Astro espera (path relativo '/', no URL absoluta).
const env = { ...process.env, BASE_URL: '/' };

const result = spawnSync('astro', ['build'], {
    stdio: 'inherit',
    env,
    shell: true
});

process.exit(result.status ?? 1);

