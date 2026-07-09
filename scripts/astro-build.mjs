/**
 * Astro/Vite usa process.env.BASE_URL como base del sitio estático.
 * El backend comparte la misma variable (.env / Vercel) con otra semántica (URL de la API).
 */
import { spawnSync } from 'node:child_process';

process.env.BASE_URL = '/';

const result = spawnSync('astro', ['build'], {
    stdio: 'inherit',
    env: process.env,
    shell: true
});

process.exit(result.status ?? 1);
