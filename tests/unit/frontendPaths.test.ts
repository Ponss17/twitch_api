import fs from 'node:fs';
import path from 'node:path';

jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: {
        FRONTEND_URL: 'http://localhost:4321',
        BASE_URL: 'http://localhost:3000/api',
        NODE_ENV: 'test'
    }
}));

import { frontendPagePath, APP_MOUNT } from '../../backend/src/core/utils/frontendPaths';
import { overlayPagePath } from '../../backend/src/core/overlay/keys';

const DIST_ROOT = path.join(__dirname, '../../dist');

/** Mapeo pathname → archivo estático generado por astro build */
const DIST_PAGE_FILES: Record<string, string> = {
    '/dashboard': 'dashboard/index.html',
    '/overlay/roulette': 'overlay/roulette/index.html',
    '/404': '404.html'
};

function pathnameFromFrontendUrl(url: string): string {
    return new URL(url).pathname;
}

describe('frontendPagePath', () => {
    it('uses root mount for dashboard (OAuth redirect)', () => {
        expect(frontendPagePath('/dashboard', 'auth=signed')).toBe(
            'http://localhost:4321/dashboard?auth=signed'
        );
    });

    it('uses trailing slash for landing', () => {
        expect(frontendPagePath('/', 'error=no_code')).toBe(
            'http://localhost:4321/?error=no_code'
        );
    });

    it('builds overlay URL at root (overlay link)', () => {
        const url = frontendPagePath(overlayPagePath('roulette'), 'overlayToken=abc');
        expect(url).toBe('http://localhost:4321/overlay/roulette?overlayToken=abc');
    });

    it('builds overlay URL for questions', () => {
        const url = frontendPagePath(overlayPagePath('questions'), 'overlayToken=abc');
        expect(url).toBe('http://localhost:4321/overlay/questions?overlayToken=abc');
    });

    it('builds 404 redirect at root (error middleware)', () => {
        expect(frontendPagePath('/404')).toBe('http://localhost:4321/404');
    });

    it('exports APP_MOUNT constant aligned with frontend paths.ts', () => {
        expect(APP_MOUNT).toBe('');
    });

    describe('dist/ alignment after astro build', () => {
        const distExists = fs.existsSync(DIST_ROOT);

        beforeAll(() => {
            if (!distExists) {
                console.warn(
                    '[frontendPaths] dist/ no encontrado — ejecuta pnpm build para verificar rutas estáticas'
                );
            }
        });

        it.each([
            ['OAuth dashboard', () => frontendPagePath('/dashboard', 'auth=signed')],
            ['overlay roulette', () => frontendPagePath(overlayPagePath('roulette'), 'overlayToken=abc')],
            ['404 redirect', () => frontendPagePath('/404')]
        ])('%s apunta a HTML existente en dist/', (_label, urlFactory) => {
            if (!distExists) {
                expect(distExists).toBe(false);
                return;
            }

            const pathname = pathnameFromFrontendUrl(urlFactory());
            const relativeFile = DIST_PAGE_FILES[pathname];
            expect(relativeFile).toBeDefined();

            const absoluteFile = path.join(DIST_ROOT, relativeFile!);
            expect(fs.existsSync(absoluteFile)).toBe(true);
        });
    });
});
