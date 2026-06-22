jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: {
        FRONTEND_URL: 'http://localhost:4321',
        BASE_URL: 'http://localhost:3000/api/twitch',
        NODE_ENV: 'test'
    }
}));

import { frontendPagePath, APP_MOUNT } from '../../backend/src/core/utils/frontendPaths';

describe('frontendPagePath', () => {
    it('uses canonical mount for dashboard', () => {
        expect(frontendPagePath('/dashboard', 'apiKey=abc')).toBe(
            'http://localhost:4321/api/twitch/dashboard?apiKey=abc'
        );
    });

    it('uses trailing slash for landing', () => {
        expect(frontendPagePath('/', 'error=no_code')).toBe(
            'http://localhost:4321/api/twitch/?error=no_code'
        );
    });

    it('exports APP_MOUNT constant', () => {
        expect(APP_MOUNT).toBe('/api/twitch');
    });
});
