// Mock global de consola para limpiar ruido en tests
global.console = {
    ...console,
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
    // warn: jest.fn(),
    // error: jest.fn(),
};

process.env.NODE_ENV = 'test';
process.env.TWITCH_CLIENT_ID = 'test_client_id';
process.env.TWITCH_CLIENT_SECRET = 'test_client_secret';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 64 chars hex dummy
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
process.env.SUPABASE_ANON_KEY = 'test_anon_key';
process.env.API_URL = 'http://localhost:3000';
