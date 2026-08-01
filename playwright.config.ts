/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const isCi = !!process.env.CI;

/** En CI evitamos anidar `pnpm` (Playwright suele fallar con exit 1); local reutiliza dev servers. */
const apiWebServer = isCi
    ? {
          command: 'npx tsx -r dotenv/config backend/src/serverless.ts',
          url: 'http://127.0.0.1:3000/health',
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: 'pipe' as const,
          stderr: 'pipe' as const
      }
    : {
          command: 'pnpm run dev:api:e2e',
          url: 'http://127.0.0.1:3000/health',
          reuseExistingServer: true,
          timeout: 120_000
      };

const webWebServer = isCi
    ? {
          command: 'npx astro dev --host 127.0.0.1 --port 4321',
          url: 'http://127.0.0.1:4321/',
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: 'pipe' as const,
          stderr: 'pipe' as const
      }
    : {
          command: 'pnpm run dev:web:e2e',
          url: 'http://127.0.0.1:4321/',
          reuseExistingServer: true,
          timeout: 120_000
      };

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
    webServer: [apiWebServer, webWebServer]
});
