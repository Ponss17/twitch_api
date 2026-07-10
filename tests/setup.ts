/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Mock global de consola para limpiar ruido en tests
global.console = {
    ...console,
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
    // warn: jest.fn(),
    // error: jest.fn(),
};

// Mock global de logger para evitar ruido en todos los tests
jest.mock('@/core/utils/logger', () => {
    const { AsyncLocalStorage } = jest.requireActual('async_hooks');
    const asyncContext = new AsyncLocalStorage();
    return {
        logger: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            startRequest: jest.fn().mockReturnValue('test-request-id')
        },
        getRequestId: jest.fn().mockReturnValue('test-request-id'),
        setRequestId: jest.fn(),
        clearRequestId: jest.fn(),
        asyncContext
    };
});

process.env.NODE_ENV = 'test';
process.env.TWITCH_CLIENT_ID = 'test_client_id';
process.env.TWITCH_CLIENT_SECRET = 'test_client_secret';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 64 chars hex dummy
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
process.env.SUPABASE_ANON_KEY = 'test_anon_key';
process.env.API_URL = 'http://localhost:3000';
process.env.GROQ_API_KEY = 'test_groq_api_key';
process.env.DISCORD_FEEDBACK_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';

// Mock global de Supabase para evitar llamadas de red reales
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
            rpc: jest.fn().mockResolvedValue({ data: null, error: null })
        })),
        auth: {
            getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
            getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null })
        }
    }))
}));

// Mock global de la conexión a Redis para no intentar contectarse en las pruebas
jest.mock('@/core/database/redisClient');
