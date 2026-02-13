import rateLimit from 'express-rate-limit';

describe('Rate Limiter Middleware', () => {
    it('should implement a rate limit function', () => {
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: 100
        });

        expect(typeof limiter).toBe('function');
    });

    // Nota: Probar la lógica interna de express-rate-limit es redundante porque es una librería externa.
    // Lo que validamos aquí es que nuestra configuración no explote.
});
