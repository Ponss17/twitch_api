import { Redis } from '@upstash/redis';

/**
 * Cliente Redis utilizando la librería oficial de Upstash.
 * Reemplaza al obsoleto @vercel/kv, manteniendo las mismas variables de entorno
 * para que no requiera cambios en la configuración del servidor.
 */
export const kv = new Redis({
    url: process.env.KV_REST_API_URL || '',
    token: process.env.KV_REST_API_TOKEN || '',
});
