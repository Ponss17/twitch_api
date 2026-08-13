import { useEffect, useRef } from 'react';
import type { Session } from '@/core/config/config';
import { clearValidateCache } from '@/core/api/auth';

/**
 * El token de Twitch dura ~4h. Disparamos validate ~40 min antes
 * para que el backend renueve (buffer backend: 30 min).
 */
const REFRESH_BEFORE_EXPIRY_MS = 40 * 60 * 1000;
/** Sin tokenExpiresAt conocido: forzar validate periódico. */
const FALLBACK_REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;
/** Reintentos si el validate/renew falla (capados; no spam). */
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000] as const;
const MAX_FAILS_BEFORE_COOLDOWN = 5;
const COOLDOWN_AFTER_MAX_FAILS_MS = 10 * 60 * 1000;
const VISIBILITY_DEBOUNCE_MS = 15_000;

/**
 * Programa validate/renew del token Twitch antes de que venza.
 * Limpia el caché de validate para forzar al backend a renovar.
 * Debounce + tope de fallos para no martillar la API.
 */
export function useProactiveTokenRefresh(
    session: Session | null,
    refresh: () => Promise<void>,
    authenticated: boolean
): void {
    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;

    const sessionRef = useRef(session);
    sessionRef.current = session;

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const generationRef = useRef(0);
    const failCountRef = useRef(0);
    const inFlightRef = useRef(false);
    const lastVisibilityRenewRef = useRef(0);

    useEffect(() => {
        if (!authenticated || !session) return;
        const generation = ++generationRef.current;
        let active = true;
        failCountRef.current = 0;

        function clearTimer() {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        function delayUntilNextRenew(): number {
            const currentSession = sessionRef.current;
            if (currentSession?.tokenExpiresAt && currentSession.tokenExpiresAt > Date.now()) {
                const msUntilExpiry = currentSession.tokenExpiresAt - Date.now();
                return Math.max(msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS, 5_000);
            }
            return FALLBACK_REFRESH_INTERVAL_MS;
        }

        async function runRenew() {
            if (!active || generation !== generationRef.current) return;
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            clearValidateCache(sessionRef.current);
            try {
                await refreshRef.current();
                failCountRef.current = 0;
                if (active && generation === generationRef.current) {
                    scheduleNext(delayUntilNextRenew());
                }
            } catch {
                if (!active || generation !== generationRef.current) return;
                failCountRef.current += 1;
                if (failCountRef.current >= MAX_FAILS_BEFORE_COOLDOWN) {
                    failCountRef.current = 0;
                    scheduleNext(COOLDOWN_AFTER_MAX_FAILS_MS);
                    return;
                }
                const idx = Math.min(failCountRef.current - 1, RETRY_DELAYS_MS.length - 1);
                scheduleNext(RETRY_DELAYS_MS[idx] ?? 120_000);
            } finally {
                inFlightRef.current = false;
            }
        }

        function scheduleNext(delayMs: number) {
            if (!active || generation !== generationRef.current) return;
            clearTimer();
            timerRef.current = setTimeout(() => {
                void runRenew();
            }, delayMs);
        }

        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            if (!active || generation !== generationRef.current) return;
            const now = Date.now();
            if (now - lastVisibilityRenewRef.current < VISIBILITY_DEBOUNCE_MS) return;
            const expiresAt = sessionRef.current?.tokenExpiresAt;
            const nearExpiry =
                !expiresAt || expiresAt - now < REFRESH_BEFORE_EXPIRY_MS + 5 * 60 * 1000;
            if (!nearExpiry) return;
            lastVisibilityRenewRef.current = now;
            void runRenew();
        };

        scheduleNext(delayUntilNextRenew());
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            active = false;
            if (generationRef.current === generation) {
                generationRef.current = generation + 1;
            }
            clearTimer();
            document.removeEventListener('visibilitychange', onVisible);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated, session?.tokenExpiresAt, session?.userId]);
}
