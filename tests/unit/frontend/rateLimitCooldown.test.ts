import { describe, expect, it, beforeEach } from '@jest/globals';
import {
    clearRateLimitCooldown,
    rateLimitWindowEnd,
    resolveRateLimitCooldownEnd,
    RATE_LIMIT_COOLDOWN_KEY
} from '@/core/errors/rateLimitCooldown';

describe('rateLimitCooldown', () => {
    beforeEach(() => {
        localStorage.clear();
        window.history.replaceState({}, '', '/429');
    });

    it('rateLimitWindowEnd calcula fin de ventana', () => {
        const now = 90_000;
        expect(rateLimitWindowEnd(60_000, now)).toBe(120_000);
    });

    it('no inventa cooldown sin until ni storage previo', () => {
        expect(resolveRateLimitCooldownEnd()).toBeNull();
    });

    it('persiste until de la URL y limpia query', () => {
        const until = Date.now() + 60_000;
        window.history.replaceState({}, '', `/429?until=${until}`);

        expect(resolveRateLimitCooldownEnd()).toBe(until);
        expect(localStorage.getItem(RATE_LIMIT_COOLDOWN_KEY)).toBe(String(until));
        expect(window.location.search).toBe('');
    });

    it('reutiliza cooldown almacenado válido', () => {
        const until = Date.now() + 30_000;
        localStorage.setItem(RATE_LIMIT_COOLDOWN_KEY, String(until));
        expect(resolveRateLimitCooldownEnd()).toBe(until);
    });

    it('clearRateLimitCooldown elimina la clave', () => {
        localStorage.setItem(RATE_LIMIT_COOLDOWN_KEY, String(Date.now() + 10_000));
        clearRateLimitCooldown();
        expect(localStorage.getItem(RATE_LIMIT_COOLDOWN_KEY)).toBeNull();
    });
});
