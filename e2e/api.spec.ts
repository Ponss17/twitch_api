import { test, expect } from '@playwright/test';

/** API Express directa (Playwright levanta dev:api:e2e en :3000). */
const API = 'http://127.0.0.1:3000';

test.describe('API (Express real)', () => {
    test('health responde ok o maintenance', async ({ request }) => {
        const res = await request.get(`${API}/health`);
        expect(res.status()).toBe(200);

        const body = (await res.json()) as { status?: string; timestamp?: string };
        expect(body.status).toMatch(/ok|maintenance/);
        expect(body.timestamp).toBeTruthy();
    });

    test('dashboard analytics sin auth devuelve error JSON unificado', async ({ request }) => {
        const res = await request.get(`${API}/api/twitch/dashboard/analytics`, {
            headers: { Accept: 'application/json' }
        });

        expect([401, 403]).toContain(res.status());

        const body = (await res.json()) as {
            success?: boolean;
            error?: { message?: string; code?: string };
        };

        expect(body.success).toBe(false);
        expect(body.error?.message).toBeTruthy();
        expect(body.error?.code).toBeTruthy();
    });

    test('auth exchange rechaza petición sin token', async ({ request }) => {
        const res = await request.get(`${API}/api/twitch/auth/exchange`);
        expect(res.status()).toBe(400);

        const body = (await res.json()) as {
            success: false;
            error: { message: string; code: string };
        };

        expect(body.success).toBe(false);
        expect(body.error.code).toBe('MISSING_AUTH');
        expect(body.error.message.length).toBeGreaterThan(0);
    });
});
