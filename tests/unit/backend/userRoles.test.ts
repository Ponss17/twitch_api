import {
    DEFAULT_USER_CACHE_TTL,
    resolveUserCacheTtl,
    resolveUserLimits,
    resolveUserRateLimit,
    USER_ROLES
} from '../../../backend/src/core/config/userRoles';
import { ownerScopedCacheKey } from '../../../backend/src/core/config/cacheTtl';

describe('userRoles', () => {
    it('resolveUserRateLimit usa rol cuando no hay personalizado', () => {
        expect(resolveUserRateLimit({ role: 'vip' })).toBe(300);
        expect(resolveUserRateLimit({ role: 'default' })).toBe(60);
    });

    it('resolveUserRateLimit prioriza personalizado sobre rol', () => {
        expect(resolveUserRateLimit({ role: 'vip', customRateLimit: 999 })).toBe(999);
    });

    it('resolveUserCacheTtl usa el mínimo entre rol y TTL del recurso', () => {
        expect(resolveUserCacheTtl({ role: 'pro' })).toBe(60);
        expect(resolveUserCacheTtl({ role: 'pro' }, 20)).toBe(20);
        expect(resolveUserCacheTtl({ role: 'partner' }, 300)).toBe(300);
        expect(resolveUserCacheTtl({ role: 'partner' }, 20)).toBe(20);
    });

    it('resolveUserCacheTtl prioriza personalizado sobre rol', () => {
        expect(resolveUserCacheTtl({ role: 'pro', customCacheTtl: 45 })).toBe(45);
    });

    it('resolveUserLimits expone flags de personalización', () => {
        const limits = resolveUserLimits({ role: 'vip', customCacheTtl: 90 });
        expect(limits.role).toBe('vip');
        expect(limits.roleLabel).toBe('VIP');
        expect(limits.rateLimit).toBe(300);
        expect(limits.cacheTtl).toBe(90);
        expect(limits.hasCustomCacheTtl).toBe(true);
        expect(limits.hasCustomRateLimit).toBe(false);
    });

    it('expone default de perfil', () => {
        expect(DEFAULT_USER_CACHE_TTL).toBe(USER_ROLES.default.cacheTtl);
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
