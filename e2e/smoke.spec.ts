import { test, expect, type Page } from '@playwright/test';

const validateOk = {
    valid: true,
    tokenExpiresAt: Date.now() + 4 * 60 * 60 * 1000,
    user: {
        login: 'e2e_streamer',
        display_name: 'E2E Streamer',
        id: '999'
    }
};

const e2eSession = {
    userId: '999',
    login: 'e2e_streamer',
    displayName: 'E2E Streamer'
};

async function mockAuthExchangeRoute(page: Page) {
    await page.route('**/api/auth/exchange**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                login: 'e2e_streamer',
                displayName: 'E2E Streamer',
                userId: '999'
            })
        })
    );
}

async function mockDashboardPanelRoutes(page: Page) {
    await page.route('**/api/dashboard/summary**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                analytics: {
                    today_requests: 0,
                    today_errors: 0,
                    today_latency: 0,
                    clips_count: 0,
                    last_stats_date: '2026-07-08'
                }
            })
        })
    );
    await page.route('**/api/dashboard/activity**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        })
    );
    await page.route('**/api/dashboard/audit-logs**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ logs: [], page: 1, pageSize: 20, total: 0 })
        })
    );
    await page.route('**/api/dashboard/user-info**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: '999',
                login: 'e2e_streamer',
                display_name: 'E2E Streamer',
                userId: '999',
                accountId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
                followers: 42,
                broadcaster_type: '',
                created_at: '2018-03-16T00:00:00.000Z',
                timezone: 'UTC',
                rateLimit: 120
            })
        })
    );
    await page.route('**/api/system/realtime-token**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ token: 'e2e_realtime_token', expiresIn: 900 })
        })
    );
}

async function mockValidateRoute(page: Page) {
    await page.route('**/api/system/validate**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(validateOk)
        })
    );
}

function waitForValidate(page: Page) {
    return page.waitForResponse(
        (response) => response.url().includes('/system/validate') && response.ok()
    );
}

async function seedSession(page: Page) {
    await page.addInitScript((session) => {
        localStorage.setItem('twitch_api_session', JSON.stringify(session));
    }, e2eSession);
}

async function gotoAuthenticatedDashboard(page: Page, path = '/dashboard/') {
    await mockValidateRoute(page);
    await mockDashboardPanelRoutes(page);
    const validated = waitForValidate(page);
    await page.goto(path);
    await validated;
    await expect(page.locator('#dashboard-page')).toBeVisible({ timeout: 15000 });
}

test.describe('smoke', () => {
    test('landing loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/LosPerris/i);
    });

    test('docs page renders', async ({ page }) => {
        await page.goto('/docs/');
        await expect(page).toHaveTitle(/Introducción \| LosPerris API/i);
    });

    test('PWA manifest icon resolves', async ({ request }) => {
        const res = await request.get('/img/logo.svg');
        expect(res.status()).toBe(200);
    });
});

test.describe('dashboard', () => {
    test.describe.configure({ mode: 'serial' });
    test('redirects unauthenticated users to landing', async ({ page }) => {
        await page.goto('/dashboard/');
        await expect(page).toHaveURL(/^(?:http:\/\/(?:localhost|127\.0\.0\.1):\d+)\/?$/);
        await expect(page.getByRole('button', { name: /Twitch/i })).toBeVisible();
    });

    test('legacy ?tab= migrates to path-based URL', async ({ page }) => {
        await seedSession(page);
        await mockValidateRoute(page);
        await mockDashboardPanelRoutes(page);
        const validated = waitForValidate(page);
        await page.goto('/dashboard/?tab=clips');
        await validated;
        await expect(page).toHaveURL(/\/dashboard\/clips\/?/);
    });

    test('manifest.json is served under mount', async ({ request }) => {
        const res = await request.get('/manifest.json');
        expect(res.status()).toBe(200);
        const json = (await res.json()) as { start_url?: string };
        expect(json.start_url).toBe('/');
    });

    test('oauth callback applies session without page reload', async ({ page }) => {
        await mockAuthExchangeRoute(page);
        await mockValidateRoute(page);
        await mockDashboardPanelRoutes(page);

        const exchanged = page.waitForResponse(
            (response) => response.url().includes('/auth/exchange') && response.ok()
        );
        const validated = waitForValidate(page);

        await page.goto('/dashboard/?auth=e2e_oauth_token');

        await exchanged;
        await validated;

        await expect(page).toHaveURL(/\/dashboard\/?$/);
        await expect(page.locator('#dashboard-page')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/E2E Streamer/i).first()).toBeVisible();
    });

    test('authenticated dashboard renders with mocked session', async ({ page }) => {
        await seedSession(page);
        await gotoAuthenticatedDashboard(page);
        await expect(page.getByText(/E2E Streamer/i).first()).toBeVisible();
    });

    test('reveal api key then logout clears local session secrets', async ({ page }) => {
        await seedSession(page);
        await page.route('**/api/dashboard/reveal-api-key**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ apiKey: 'e2e_revealed_key', masked: 'e2e_••••' })
            })
        );
        await page.route('**/api/auth/logout**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            })
        );
        // Settings es una vista interna de React; Astro solo sirve /dashboard/ directamente.
        await gotoAuthenticatedDashboard(page);

        const revealed = await page.evaluate(async () => {
            const res = await fetch('/api/dashboard/reveal-api-key/', {
                credentials: 'include',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            return res.json();
        });
        expect(revealed.apiKey).toBe('e2e_revealed_key');

        const storedBefore = await page.evaluate(() => localStorage.getItem('twitch_api_session'));
        expect(storedBefore).toBeTruthy();
        expect(storedBefore).not.toContain('e2e_revealed_key');
        expect(storedBefore).not.toContain('apiKey');

        await page.evaluate(async () => {
            await fetch('/api/auth/logout/', { method: 'POST', credentials: 'include' });
            localStorage.removeItem('twitch_api_session');
        });
        const storedAfter = await page.evaluate(() => localStorage.getItem('twitch_api_session'));
        expect(storedAfter).toBeNull();
    });

    test('sidebar navigation updates tab in URL', async ({ page }) => {
        await seedSession(page);
        await gotoAuthenticatedDashboard(page);

        await page.locator('aside nav').getByRole('button', { name: 'Clips' }).click();
        await expect(page).toHaveURL(/\/dashboard\/clips\/?/);
    });

    test('settings security: regenerate API key via mocked UI', async ({ page }) => {
        await seedSession(page);
        await page.route('**/api/system/regenerate-key**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    apiKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
                    masked: 'aaaa••••eeee'
                })
            })
        );
        await gotoAuthenticatedDashboard(page, '/dashboard/settings/seguridad/');

        await expect(page.getByRole('tab', { name: 'Seguridad' })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        await page.getByRole('button', { name: 'Regenerar' }).click();
        await expect(page.getByRole('heading', { name: 'Regenerar API Key' })).toBeVisible();

        const regen = page.waitForResponse(
            (response) => response.url().includes('/system/regenerate-key') && response.ok()
        );
        await page.getByRole('dialog').getByRole('button', { name: 'Regenerar' }).click();
        await regen;

        await expect(page.getByText('Nueva API Key generada')).toBeVisible({ timeout: 10000 });
    });

    test('settings data: export CSV via mocked UI', async ({ page }) => {
        await seedSession(page);
        await page.route('**/api/dashboard/export-check**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true })
            })
        );
        await page.route('**/api/dashboard/export-complete**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true })
            })
        );
        await page.route('**/api/dashboard/analytics**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    analytics: {
                        today_requests: 3,
                        total_requests: 10,
                        success_rate: 100,
                        avg_latency: 42
                    }
                })
            })
        );
        await gotoAuthenticatedDashboard(page, '/dashboard/settings/datos/');

        await expect(page.getByRole('tab', { name: 'Datos' })).toHaveAttribute(
            'aria-selected',
            'true'
        );

        // Selectors estables: el título del grupo y el de la fila ya no deben compartirse en el assert.
        const exportFormat = page.locator('#settings-export-format');
        await expect(exportFormat).toBeVisible();
        await expect(page.getByRole('button', { name: 'Descargar respaldo' })).toBeVisible();

        await exportFormat.click();
        await page.getByRole('option', { name: 'CSV' }).click();

        const exportCheck = page.waitForResponse(
            (response) => response.url().includes('/dashboard/export-check') && response.ok()
        );
        await page.getByRole('button', { name: 'Descargar respaldo' }).click();
        await exportCheck;

        await expect(page.getByText('Archivo descargado correctamente')).toBeVisible({
            timeout: 10000
        });
    });

    test('feedback modal submits anonymously with mocked API', async ({ page }) => {
        await seedSession(page);
        let postedBody: Record<string, unknown> | null = null;
        await page.route('**/api/system/feedback**', async (route) => {
            postedBody = route.request().postDataJSON() as Record<string, unknown>;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });
        await gotoAuthenticatedDashboard(page);

        await page.getByRole('button', { name: 'Abrir feedback' }).click();
        await expect(page.getByRole('heading', { name: 'Enviar Feedback' })).toBeVisible();

        await page.getByRole('switch', { name: 'Enviar de forma anónima' }).click();
        await page.getByPlaceholder('Cuéntanos qué tienes en mente...').fill(
            'E2E feedback anónimo de prueba'
        );

        const feedback = page.waitForResponse(
            (response) => response.url().includes('/system/feedback') && response.ok()
        );
        await page.getByRole('button', { name: 'Enviar Feedback' }).click();
        await feedback;

        expect(postedBody).toMatchObject({
            anonymous: true,
            message: 'E2E feedback anónimo de prueba'
        });
        await expect(page.getByText('¡Gracias por tu feedback!')).toBeVisible();
    });
});
