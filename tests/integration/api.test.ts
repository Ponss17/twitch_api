import request from 'supertest';
import app from '../../backend/src/app';

describe('Integration: Rutas del sistema', () => {
    describe('GET /health', () => {
        it('debe responder 200 con status ok o maintenance', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBeDefined();
            expect(['ok', 'maintenance']).toContain(res.body.status);
            expect(res.body.timestamp).toBeDefined();
        });
    });

    describe('GET /api/health', () => {
        it('debe responder igual que /health', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBeDefined();
        });
    });

    describe('GET /robots.txt', () => {
        it('debe responder con Content-Type text/plain', async () => {
            const res = await request(app).get('/robots.txt');
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/text\/plain/);
        });
    });

    describe('GET /sitemap.xml', () => {
        it('debe responder con Content-Type xml', async () => {
            const res = await request(app).get('/sitemap.xml');
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/xml/);
        });
    });
});

describe('Integration: Rutas protegidas', () => {
    describe('GET /api/dashboard/summary', () => {
        it('debe rechazar sin token ni apiKey', async () => {
            const res = await request(app).get('/api/dashboard/summary');
            expect([401, 403]).toContain(res.status);
        });
    });

    describe('GET /api/dashboard/analytics', () => {
        it('debe rechazar sin autenticación con error JSON unificado', async () => {
            const res = await request(app)
                .get('/api/dashboard/analytics')
                .set('Accept', 'application/json');

            expect([401, 403]).toContain(res.status);
            expect(res.body.success).toBe(false);
            expect(res.body.error?.message).toEqual(expect.any(String));
            expect(res.body.error?.code).toEqual(expect.any(String));
        });
    });

    describe('POST /api/dashboard/clear-data', () => {
        it('debe rechazar sin autenticación', async () => {
            const res = await request(app)
                .post('/api/dashboard/clear-data')
                .send({ confirm: 'LIMPIAR' });
            expect([401, 403]).toContain(res.status);
        });
    });

    describe('DELETE /api/dashboard/delete-account', () => {
        it('debe rechazar sin autenticación', async () => {
            const res = await request(app)
                .delete('/api/dashboard/delete-account')
                .send({ confirm: 'ELIMINAR' });
            expect([401, 403]).toContain(res.status);
        });
    });
});

describe('Integration: Rutas inexistentes', () => {
    describe('GET /ruta-que-no-existe', () => {
        it('debe rechazar rutas desconocidas (401 o 404)', async () => {
            const res = await request(app)
                .get('/api/ruta-inventada-12345')
                .set('Accept', 'application/json');
            expect([401, 404]).toContain(res.status);
        });
    });
});

describe('Integration: Seguridad de headers', () => {
    it('debe incluir headers de seguridad en cualquier respuesta', async () => {
        const res = await request(app).get('/health');
        // Helmet headers
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('DENY');
    });
});
