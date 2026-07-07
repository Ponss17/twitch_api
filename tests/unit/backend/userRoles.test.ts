import {
    resolveUserLimits,
    resolveUserRateLimit
} from '../../../backend/src/core/config/userRoles';
import { ownerScopedCacheKey, resolveCache } from '../../../backend/src/core/config/cacheTtl';

describe('userRoles', () => {
    it('resolveUserRateLimit usa rol cuando no hay personalizado', () => {
        expect(resolveUserRateLimit({ role: 'vip' })).toBe(90);
        expect(resolveUserRateLimit({ role: 'default' })).toBe(30);
    });

    it('resolveUserRateLimit prioriza personalizado sobre rol', () => {
        expect(resolveUserRateLimit({ role: 'vip', customRateLimit: 999 })).toBe(999);
    });

    it('resolveCache usa los valores estáticos de la matriz', () => {
        expect(resolveCache('COMMAND', 'pro')).toBe(80);
        expect(resolveCache('CLIPS', 'partner')).toBe(15);
        expect(resolveCache('DASHBOARD_PROFILE', 'default')).toBe(300);
        // Fallback a default si el rol es inválido o no se envía
        expect(resolveCache('CHATTERS', null)).toBe(30);
    });

    it('resolveCache prioriza personalizado sobre rol', () => {
        expect(resolveCache('COMMAND', 'pro', 45)).toBe(45);
    });

    it('resolveUserLimits expone flags de personalización', () => {
        const limits = resolveUserLimits({ role: 'vip', customCacheTtl: 90 });
        expect(limits.role).toBe('vip');
        expect(limits.roleLabel).toBe('VIP');
        expect(limits.rateLimit).toBe(90);
        expect(limits.hasCustomCacheTtl).toBe(true);
        expect(limits.hasCustomRateLimit).toBe(false);
    });
});

describe('ownerScopedCacheKey', () => {
    it('añade owner al key', () => {
        expect(ownerScopedCacheKey('u1', 'cache:cmd:test')).toBe('cache:cmd:test:owner:u1');
    });

    it('devuelve key sin cambios si falta userId', () => {
        expect(ownerScopedCacheKey(undefined, 'cache:cmd:test')).toBe('cache:cmd:test');
    });
});
