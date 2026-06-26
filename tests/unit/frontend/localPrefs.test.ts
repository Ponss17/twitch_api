import { describe, expect, it, beforeEach } from '@jest/globals';
import {
    readScopedPref,
    sessionFingerprint,
    userPrefKey,
    writeScopedPref
} from '@/lib/localPrefs';
import type { Session } from '@/lib/config';

describe('localPrefs', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('userPrefKey concatena base y userId', () => {
        expect(userPrefKey('dashboard_last_sync', '42')).toBe('dashboard_last_sync_42');
    });

    it('sessionFingerprint prioriza userId', () => {
        const session: Pick<Session, 'userId' | 'apiKey' | 'token'> = {
            userId: 'u1',
            apiKey: 'key',
            token: 'tok'
        };
        expect(sessionFingerprint(session)).toBe('u1');
    });

    it('writeScopedPref y readScopedPref migran clave legacy', () => {
        localStorage.setItem('dashboard_last_sync', '12345');
        const value = readScopedPref('dashboard_last_sync', 'user-a', 'dashboard_last_sync');
        expect(value).toBe('12345');
        expect(localStorage.getItem('dashboard_last_sync_user-a')).toBe('12345');
        expect(localStorage.getItem('dashboard_last_sync')).toBeNull();
    });

    it('writeScopedPref guarda por userId', () => {
        writeScopedPref('profile_last_sync', 'user-b', '999', 'profile_last_sync');
        expect(readScopedPref('profile_last_sync', 'user-b', 'profile_last_sync')).toBe('999');
        expect(readScopedPref('profile_last_sync', 'user-c', 'profile_last_sync')).toBeNull();
    });
});
