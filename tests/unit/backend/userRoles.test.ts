import {
    resolveUserHeavyLimit,
    resolveUserLimits,
    resolveUserRateLimit
} from '../../../backend/src/core/config/userRoles';
import { ownerScopedCacheKey, resolveCache } from '../../../backend/src/core/config/cacheTtl';

describe('userRoles', () => {
    it('resolveUserRateLimit usa rol cuando no hay personalizado', () => {
        expect(resolveUserRateLimit({ role: 'vip' })).toBe(90);
        expect(resolveUserRateLimit({ role: 'default' })).toBe(30);
        expect(resolveUserRateLimit({ role: 'partner' })).toBe(120);
    });

    it('resolveUserRateLimit prioriza personalizado sobre rol', () => {
        expect(resolveUserRateLimit({ role: 'vip', customRateLimit: 999 })).toBe(999);
    });

    it('resolveUserHeavyLimit escala por rol', () => {
        expect(resolveUserHeavyLimit({ role: 'default' })).toBe(5);
        expect(resolveUserHeavyLimit({ role: 'pro' })).toBe(12);
        expect(resolveUserHeavyLimit({ role: 'vip' })).toBe(20);
        expect(resolveUserHeavyLimit({ role: 'partner' })).toBe(40);
    });

    it('resolveCache premia retención (COMMAND) y frescura (CLIPS/CHATTERS)', () => {
        expect(resolveCache('COMMAND', 'pro')).toBe(80);
        expect(resolveCache('COMMAND', 'partner')).toBe(240);
        expect(resolveCache('CLIPS', 'partner')).toBe(15);
        expect(resolveCache('CHATTERS', 'default')).toBe(45);
        expect(resolveCache('CHATTERS', 'partner')).toBe(10);
        expect(resolveCache('ELIGIBILITY', 'vip')).toBe(40);
        expect(resolveCache('STREAM_LIVE', 'partner')).toBe(8);
        expect(resolveCache('DASHBOARD_PROFILE', 'default')).toBe(300);
        expect(resolveCache('CHATTERS', null)).toBe(45);
    });

    it('resolveCache prioriza personalizado sobre rol', () => {
        expect(resolveCache('COMMAND', 'pro', 45)).toBe(45);
    });

    it('resolveUserLimits expone flags y beneficios del rol', () => {
        const limits = resolveUserLimits({ role: 'vip', customCacheTtl: 90 });
        expect(limits.role).toBe('vip');
        expect(limits.roleLabel).toBe('VIP');
        expect(limits.rateLimit).toBe(90);
        expect(limits.heavyLimit).toBe(20);
        expect(limits.cacheTtl).toBe(90);
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
