import { test, expect, type Page } from '@playwright/test';

const validateOk = {
    valid: true,
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
    await page.route('**/api/dashboard/user-info**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                followers: 42,
                broadcaster_type: '',
                created_at: '2018-03-16T00:00:00.000Z'
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
        await expect(page).toHaveTitle(/Comandos y Herramientas para Streamers \| LosPerris/i);
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
        await expect(page.getByRole('button', { name: /Iniciar Sesión con Twitch/i })).toBeVisible();
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

    test('sidebar navigation updates tab in URL', async ({ page }) => {
        await seedSession(page);
        await gotoAuthenticatedDashboard(page);

        await page.locator('aside nav').getByRole('button', { name: 'Clips' }).click();
        await expect(page).toHaveURL(/\/dashboard\/clips\/?/);
    });
});
