import dotenv from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    dotenv.config({ quiet: true });
}

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    TWITCH_CLIENT_ID: z.string().min(1, 'TWITCH_CLIENT_ID es obligatorio'),
    TWITCH_CLIENT_SECRET: z.string().min(1, 'TWITCH_CLIENT_SECRET es obligatorio'),
    ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY debe tener al menos 32 caracteres'),
    /**
     * Secreto HMAC para state/auth/overlay — independiente de TWITCH_CLIENT_SECRET.
     * Obligatorio en producción; en dev/test cae al client secret si se omite.
     */
    HMAC_SIGNING_SECRET: z.string().min(32).optional(),
    TWITCH_REDIRECT_URI: z
        .string()
        .url()
        .default('https://ttv.losperris.dev/api/auth/twitch/callback'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MAX_MESSAGE_TOKENS: z.coerce.number().default(100),
    DISCORD_FEEDBACK_WEBHOOK_URL: z.string().url().optional(),
    DISCORD_HEALTH_WEBHOOK_URL: z.string().url().optional(),
    /** OAuth Discord (vincular cuenta) — opcionales hasta configurar el portal. */
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    DISCORD_REDIRECT_URI: z.string().url().optional(),
    GROQ_API_KEY: z.string().optional(),
    BASE_URL: z.string().url().default('https://ttv.losperris.dev/api'),
    // Admin vars removed
    SUPABASE_URL: z.string().url().min(1, 'SUPABASE_URL es obligatorio'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY es obligatorio'),
    SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY es obligatorio'),
    SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET es obligatorio'),
    FRONTEND_URL: z.string().url().optional(),
    /** Upstash Redis — obligatorias en producción, opcionales en dev/test (fail-open). */
    KV_REST_API_URL: z.string().url().optional(),
    KV_REST_API_TOKEN: z.string().optional()
});

const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

/** Valores canónicos cuando el deploy en Vercel trae localhost del .env local. */
const PRODUCTION_URLS = {
    TWITCH_REDIRECT_URI: 'https://ttv.losperris.dev/api/auth/twitch/callback',
    DISCORD_REDIRECT_URI: 'https://ttv.losperris.dev/api/auth/discord/callback',
    BASE_URL: 'https://ttv.losperris.dev/api',
    FRONTEND_URL: 'https://ttv.losperris.dev'
} as const;

const isLocalhostUrl = (value: string | undefined): boolean => {
    if (!value) return false;
    try {
        const { hostname } = new URL(value);
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        return false;
    }
};

/** En Vercel producción, nunca usar localhost (OAuth e iconos rotos). */
const resolveProductionUrl = (
    value: string | undefined,
    key: keyof typeof PRODUCTION_URLS
): string | undefined => {
    const onVercel = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';
    if (!onVercel) return value;
    if (!value || isLocalhostUrl(value)) {
        if (value && !process.env.JEST_WORKER_ID) {
            console.warn(
                `[env] ${key} apunta a localhost en Vercel (${value}); usando ${PRODUCTION_URLS[key]}`
            );
        }
        return PRODUCTION_URLS[key];
    }
    return value;
};

const envVars = {
    PORT: process.env.PORT || (isTest ? 3000 : undefined),
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || (isTest ? 'test_id' : undefined),
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET || (isTest ? 'test_secret' : undefined),
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || (isTest ? 'a'.repeat(64) : undefined),
    HMAC_SIGNING_SECRET: process.env.HMAC_SIGNING_SECRET,
    TWITCH_REDIRECT_URI:
        resolveProductionUrl(process.env.TWITCH_REDIRECT_URI, 'TWITCH_REDIRECT_URI') ||
        (isTest ? 'http://localhost' : undefined),
    NODE_ENV: process.env.NODE_ENV || (isTest ? 'test' : 'development'),
    MAX_MESSAGE_TOKENS: process.env.MAX_MESSAGE_TOKENS,
    DISCORD_FEEDBACK_WEBHOOK_URL: process.env.DISCORD_FEEDBACK_WEBHOOK_URL,
    DISCORD_HEALTH_WEBHOOK_URL: process.env.DISCORD_HEALTH_WEBHOOK_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI:
        resolveProductionUrl(process.env.DISCORD_REDIRECT_URI, 'DISCORD_REDIRECT_URI') ||
        process.env.DISCORD_REDIRECT_URI ||
        (isTest ? 'http://localhost/api/auth/discord/callback' : undefined),
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    BASE_URL:
        resolveProductionUrl(process.env.BASE_URL, 'BASE_URL') ||
        (isTest ? 'http://localhost' : undefined),
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || (isTest ? 'test_anon' : undefined),
    SUPABASE_JWT_SECRET:
        process.env.SUPABASE_JWT_SECRET ||
        (isTest ? 'test_jwt_secret_for_testing_purposes_only' : undefined),
    FRONTEND_URL: resolveProductionUrl(process.env.FRONTEND_URL, 'FRONTEND_URL'),
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN
};

const isProd = process.env.NODE_ENV === 'production';
const parsed = envSchema.safeParse(envVars);

if (!parsed.success) {
    console.error('❌ Error de validación de variables de entorno:');
    parsed.error.issues.forEach((issue) => {
        console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    });

    if (isProd) {
        console.error('🛑 El servidor se detiene en producción debido a errores de configuración.');
        process.exit(1);
    }
    if (process.env.ALLOW_INVALID_ENV !== 'true') {
        console.error(
            '🛑 Configuración inválida. Corrige .env o define ALLOW_INVALID_ENV=true solo en desarrollo local.'
        );
        process.exit(1);
    }
    console.warn('⚠ ALLOW_INVALID_ENV=true — arrancando con configuración no validada.');
}

/** En producción el HMAC debe ser independiente del TWITCH_CLIENT_SECRET. */
if (isProd && !isTest) {
    const hmac = process.env.HMAC_SIGNING_SECRET?.trim();
    if (!hmac || hmac.length < 32) {
        console.error(
            '🛑 HMAC_SIGNING_SECRET es obligatorio en producción (≥32 caracteres). No reutilices TWITCH_CLIENT_SECRET.'
        );
        process.exit(1);
    }

    /** KV (Upstash Redis) — obligatorio en producción para rate limiting y caché. */
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.error(
            '🛑 KV_REST_API_URL y KV_REST_API_TOKEN son obligatorios en producción. El rate limiting no funcionará sin ellos.'
        );
        process.exit(1);
    }
}

const rawConfig = parsed.success
    ? parsed.data
    : (envVars as unknown as z.infer<typeof envSchema>);

/** Opcional en Vercel: dominio público = origen de BASE_URL (losperris.dev). */
const deriveFrontendUrl = (baseUrl: string, explicit?: string): string | undefined => {
    if (explicit && !isLocalhostUrl(explicit)) {
        return explicit.replace(/\/$/, '');
    }
    try {
        return new URL(baseUrl).origin;
    } catch {
        return undefined;
    }
};

export const CONFIG = {
    ...rawConfig,
    FRONTEND_URL: deriveFrontendUrl(rawConfig.BASE_URL, rawConfig.FRONTEND_URL)
};
