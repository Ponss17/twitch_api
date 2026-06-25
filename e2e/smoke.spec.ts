import { test, expect, type Page } from '@playwright/test';

const validateOk = {
    valid: true,
    apiKey: 'e2e_test_key',
    user: {
        login: 'e2e_streamer',
        display_name: 'E2E Streamer',
        id: '999'
    }
};

const e2eSession = {
    apiKey: 'e2e_test_key',
    login: 'e2e_streamer',
    displayName: 'E2E Streamer'
};

async function mockValidateRoute(page: Page) {
    await page.route('**/api/twitch/system/validate**', (route) =>
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

async function gotoAuthenticatedDashboard(page: Page, path = '/api/twitch/dashboard/') {
    await mockValidateRoute(page);
    const validated = waitForValidate(page);
    await page.goto(path);
    await validated;
    await expect(page.locator('#dashboard-page')).toBeVisible({ timeout: 15000 });
}

test.describe('smoke', () => {
    test('landing loads', async ({ page }) => {
        await page.goto('/api/twitch/');
        await expect(page).toHaveTitle(/LosPerris Twitch API/i);
    });

    test('docs page renders', async ({ page }) => {
        await page.goto('/api/twitch/docs/');
        await expect(page).toHaveTitle(/Documentación API/i);
    });

    test('PWA manifest icon resolves', async ({ request }) => {
        const res = await request.get('/api/twitch/img/logo.svg');
        expect(res.status()).toBe(200);
    });
});

test.describe('dashboard', () => {
    test.describe.configure({ mode: 'serial' });
    test('redirects unauthenticated users to landing', async ({ page }) => {
        await page.goto('/api/twitch/dashboard/');
        await expect(page).toHaveURL(/\/api\/twitch\/?$/);
        await expect(page.getByRole('button', { name: /Iniciar Sesión con Twitch/i })).toBeVisible();
    });

    test('legacy ?tab= migrates to path-based URL', async ({ page }) => {
        await seedSession(page);
        await mockValidateRoute(page);
        await page.goto('/api/twitch/dashboard/?tab=clips');
        await expect(page).toHaveURL(/\/dashboard\/clips\/?/);
    });

    test('manifest.json is served under mount', async ({ request }) => {
        const res = await request.get('/api/twitch/manifest.json');
        expect(res.status()).toBe(200);
        const json = (await res.json()) as { start_url?: string };
        expect(json.start_url).toBe('/api/twitch/');
    });

    test('oauth callback applies session without page reload', async ({ page }) => {
        await mockValidateRoute(page);

        await page.goto(
            '/api/twitch/dashboard/?apiKey=e2e_oauth&login=e2euser&displayName=E2E%20User&userId=42'
        );

        await expect(page).toHaveURL(/\/api\/twitch\/dashboard\/?$/);
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
