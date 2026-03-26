import dotenv from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    TWITCH_CLIENT_ID: z.string().min(1, 'TWITCH_CLIENT_ID es obligatorio'),
    TWITCH_CLIENT_SECRET: z.string().min(1, 'TWITCH_CLIENT_SECRET es obligatorio'),
    ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY es obligatorio'),
    TWITCH_REDIRECT_URI: z
        .string()
        .url()
        .default('https://www.losperris.dev/api/twitch/auth/twitch/callback'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MAX_MESSAGE_TOKENS: z.coerce.number().default(100),
    DISCORD_FEEDBACK_WEBHOOK_URL: z.string().url().optional(),
    GROQ_API_KEY: z.string().optional(),
    BASE_URL: z.string().url().default('https://www.losperris.dev/api/twitch'),
    ADMIN_ROOT_ID: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    SUPABASE_URL: z.string().url().min(1, 'SUPABASE_URL es obligatorio'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY es obligatorio'),
    SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY es obligatorio')
});

const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

const envVars = {
    PORT: process.env.PORT || (isTest ? 3000 : undefined),
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || (isTest ? 'test_id' : undefined),
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET || (isTest ? 'test_secret' : undefined),
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || (isTest ? 'a'.repeat(64) : undefined),
    TWITCH_REDIRECT_URI:
        process.env.TWITCH_REDIRECT_URI || (isTest ? 'http://localhost' : undefined),
    NODE_ENV: process.env.NODE_ENV || (isTest ? 'test' : 'development'),
    MAX_MESSAGE_TOKENS: process.env.MAX_MESSAGE_TOKENS,
    DISCORD_FEEDBACK_WEBHOOK_URL: process.env.DISCORD_FEEDBACK_WEBHOOK_URL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    BASE_URL: process.env.BASE_URL || (isTest ? 'http://localhost' : undefined),
    ADMIN_ROOT_ID: process.env.ADMIN_ROOT_ID,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        (isTest ? 'test_anon' : undefined)
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
}

export const CONFIG = parsed.success
    ? parsed.data
    : (envVars as unknown as z.infer<typeof envSchema>);
