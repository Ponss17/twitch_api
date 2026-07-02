import {
    overlayStateFingerprint,
    overlayTrendsRemaining,
    shouldShowTrendsOverlay,
    TRENDS_OVERLAY_RESULTS_MS
} from '@/features/tools/overlay/lib/overlayStateUtils';
import type { TrendsOverlayState } from '@/features/tools/overlay/lib/types';

describe('overlayStateUtils', () => {
    it('overlayStateFingerprint ignora updatedAt', () => {
        const base: TrendsOverlayState = {
            tracking: true,
            remaining: 120,
            timerEnded: false,
            wordCounts: { hola: 2 },
            minutes: 5,
            displayName: 'Test',
            sessionActive: true,
            updatedAt: 1000
        };
        const a = overlayStateFingerprint('trends', base);
        const b = overlayStateFingerprint('trends', { ...base, updatedAt: 9999 });
        expect(a).toBe(b);
    });

    it('overlayStateFingerprint distingue cambios de contenido', () => {
        const base: TrendsOverlayState = {
            tracking: true,
            remaining: 120,
            timerEnded: false,
            wordCounts: { hola: 2 },
            minutes: 5,
            displayName: 'Test',
            sessionActive: true,
            updatedAt: 1000
        };
        const a = overlayStateFingerprint('trends', base);
        const b = overlayStateFingerprint('trends', {
            ...base,
            wordCounts: { hola: 3 }
        });
        expect(a).not.toBe(b);
    });

    it('overlayTrendsRemaining usa timerEndsAt cuando está disponible', () => {
        const now = 10_000;
        const state: TrendsOverlayState = {
            tracking: true,
            remaining: 60,
            timerEnded: false,
            wordCounts: {},
            minutes: 5,
            displayName: 'Test',
            sessionActive: true,
            timerEndsAt: now + 45_000,
            updatedAt: now - 60_000
        };
        expect(overlayTrendsRemaining(state, now)).toBe(45);
    });

    it('overlayTrendsRemaining deriva segundos desde updatedAt sin timerEndsAt', () => {
        const now = 10_000;
        const state: TrendsOverlayState = {
            tracking: true,
            remaining: 60,
            timerEnded: false,
            wordCounts: {},
            minutes: 5,
            displayName: 'Test',
            sessionActive: true,
            updatedAt: now - 15_000
        };
        expect(overlayTrendsRemaining(state, now)).toBe(45);
    });

    it('overlayTrendsRemaining devuelve 0 al terminar', () => {
        const state: TrendsOverlayState = {
            tracking: false,
            remaining: 0,
            timerEnded: true,
            wordCounts: {},
            minutes: 5,
            displayName: 'Test',
            sessionActive: false,
            updatedAt: Date.now()
        };
        expect(overlayTrendsRemaining(state)).toBe(0);
    });

    it('shouldShowTrendsOverlay visible mientras tracking', () => {
        const state: TrendsOverlayState = {
            tracking: true,
            remaining: 30,
            timerEnded: false,
            wordCounts: {},
            minutes: 5,
            displayName: 'Test',
            sessionActive: true,
            updatedAt: Date.now()
        };
        expect(shouldShowTrendsOverlay(state)).toBe(true);
    });

    it('shouldShowTrendsOverlay oculto en reposo', () => {
        const state: TrendsOverlayState = {
            tracking: false,
            remaining: 0,
            timerEnded: false,
            wordCounts: {},
            minutes: 5,
            displayName: 'Test',
            sessionActive: false,
            updatedAt: Date.now()
        };
        expect(shouldShowTrendsOverlay(state)).toBe(false);
    });

    it('shouldShowTrendsOverlay muestra resultados tras timer y se oculta', () => {
        const endedAt = 50_000;
        const state: TrendsOverlayState = {
            tracking: false,
            remaining: 0,
            timerEnded: true,
            wordCounts: { hola: 3 },
            minutes: 5,
            displayName: 'Test',
            sessionActive: true,
            updatedAt: endedAt
        };
        expect(shouldShowTrendsOverlay(state, endedAt + 5_000)).toBe(true);
        expect(shouldShowTrendsOverlay(state, endedAt + TRENDS_OVERLAY_RESULTS_MS)).toBe(false);
    });
});
