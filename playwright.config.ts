import { defineConfig, devices } from '@playwright/test';

const isCi = !!process.env.CI;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: !isCi,
    forbidOnly: isCi,
    retries: isCi ? 2 : 0,
    workers: isCi ? 1 : undefined,
    reporter: isCi ? [['github'], ['list']] : 'list',
    use: {
        baseURL: 'http://127.0.0.1:4321',
        trace: 'on-first-retry'
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: [
        {
            command: 'pnpm dev:api:e2e',
            url: 'http://127.0.0.1:3000/health',
            reuseExistingServer: !isCi,
            timeout: 120_000
        },
        {
            command: 'pnpm dev:web',
            url: 'http://127.0.0.1:4321/api/twitch/',
            reuseExistingServer: !isCi,
            timeout: 120_000
        }
    ]
});
