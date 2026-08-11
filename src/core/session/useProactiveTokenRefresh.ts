import { useEffect, useRef } from 'react';
import type { Session } from '@/core/config/config';
import { clearValidateCache } from '@/core/api/auth';

/**
 * Intervalo entre un refresh exitoso y el siguiente chequeo.
 * El token de Twitch dura ~4h; renovamos 35 minutos antes para dar
 * margen ante cold starts de Vercel (buffer real en backend: 30min).
 */
const REFRESH_BEFORE_EXPIRY_MS = 35 * 60 * 1000; // 35 minutos
/**
 * Si no conocemos el tokenExpiresAt exacto, programamos un refresh
 * cada 3h30m para garantizar que el token siempre esté fresco.
 */
const FALLBACK_REFRESH_INTERVAL_MS = 3.5 * 60 * 60 * 1000; // 3.5 horas

/**
 * Hook que programa un refresh proactivo del token de Twitch.
 *
 * En lugar de esperar a que una petición falle con 401 para renovar,
 * calcula cuándo vence el token y programa un setTimeout que llama a
 * `refresh()` (del SessionContext) antes de que expire.
 *
 * IMPORTANTE: limpia el caché de validate antes de llamar refresh(),
 * de lo contrario validateSession() devolvería el caché local sin llegar
 * al backend, y el token de Twitch nunca se renovaría.
 *
 * Tras cada refresh exitoso, reprograma el siguiente timer automáticamente,
 * logrando una sesión que se mantiene viva indefinidamente sin acción del usuario.
 *
 * @param session - Sesión actual (puede incluir `tokenExpiresAt` si el backend lo proveyó).
 * @param refresh  - Función del SessionProvider que revalida la sesión.
 * @param authenticated - Solo activa el timer si el usuario está autenticado.
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

    useEffect(() => {
        if (!authenticated || !session) return;
        const generation = ++generationRef.current;
        let active = true;

        function clearTimer() {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        function scheduleNext() {
            if (!active || generation !== generationRef.current) return;
            clearTimer();

            let delayMs: number;

            const currentSession = sessionRef.current;
            if (currentSession?.tokenExpiresAt && currentSession.tokenExpiresAt > Date.now()) {
                // Tenemos la fecha exacta de expiración — calcular el delay preciso
                const msUntilExpiry = currentSession.tokenExpiresAt - Date.now();
                delayMs = Math.max(msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS, 60_000);
            } else {
                // Sin fecha conocida → usar intervalo fijo de 3.5h
                delayMs = FALLBACK_REFRESH_INTERVAL_MS;
            }

            timerRef.current = setTimeout(async () => {
                if (!active || generation !== generationRef.current) return;
                // CRÍTICO: limpiar el caché de validate antes de llamar refresh().
                // Sin esto, validateSession() devuelve el caché local sin
                // llegar al backend, y el token de Twitch nunca se renueva.
                clearValidateCache(sessionRef.current);

                try {
                    await refreshRef.current();
                    if (active && generation === generationRef.current) scheduleNext();
                } catch {
                    if (active && generation === generationRef.current) {
                        timerRef.current = setTimeout(() => scheduleNext(), 5 * 60 * 1000);
                    }
                }
            }, delayMs);
        }

        scheduleNext();

        return () => {
            active = false;
            // Invalidate this effect's generation without clobbering a newer effect's value.
            if (generationRef.current === generation) {
                generationRef.current = generation + 1;
            }
            clearTimer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated, session?.tokenExpiresAt, session?.userId]);
}
