import request from 'supertest';
import app from '../../backend/src/app';

describe('API 404 handler', () => {
    it('returns text/plain for unknown API routes', async () => {
        const res = await request(app)
            .get('/api/twitch/ruta-inexistente-test-404')
            .set('Accept', 'application/json');

        expect([401, 404]).toContain(res.status);
        if (res.status === 404) {
            expect(res.headers['content-type']).toMatch(/text\/plain/);
            expect(res.text).toContain('Error 404');
        }
    });
});
