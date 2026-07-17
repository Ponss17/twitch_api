import {
    AUTH_QUERY_DISPLAY_MASK,
    buildAuthQueryParam,
    buildAuthQueryParamForDisplay
} from '@/core/api/authQuery';

describe('authQuery', () => {
    it('buildAuthQueryParam codifica la key real para copiar', () => {
        expect(buildAuthQueryParam({ apiKey: 'sk_test/key', token: null })).toBe(
            'apiKey=sk_test%2Fkey'
        );
    });

    it('buildAuthQueryParamForDisplay siempre enmascara (sin secretos en UI)', () => {
        expect(
            buildAuthQueryParamForDisplay({ apiKey: 'sk_real_secret_key', token: null })
        ).toBe(`apiKey=${AUTH_QUERY_DISPLAY_MASK}`);
        expect(buildAuthQueryParamForDisplay({ apiKey: null, token: null })).toBe(
            `apiKey=${AUTH_QUERY_DISPLAY_MASK}`
        );
        expect(
            buildAuthQueryParamForDisplay({ apiKey: null, token: 'oauth_token_xyz' })
        ).toBe(`apiKey=${AUTH_QUERY_DISPLAY_MASK}`);
        expect(buildAuthQueryParamForDisplay()).toBe(`apiKey=${AUTH_QUERY_DISPLAY_MASK}`);
    });
});
