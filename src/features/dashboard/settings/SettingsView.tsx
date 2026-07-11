import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import { fetchRevealApiKey } from '@/core/auth/revealApiKey';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { fetchDashboardProfile, type DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';
import {
    broadcastHomeDataReset,
    clearDashboardSyncPrefs,
    PROFILE_POLL_MS,
    readPanelSyncPref,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { useRequiredSession, useSession } from '@/core/session/useSession';
import { maskApiKey } from '@/core/utils/utils';
import { fadeIn } from '@/core/utils/tw';
import { appPath } from '@/core/config/paths';
import { DangerConfirmModal, PostRegenKeyModal, RegenKeyModal } from '@/shared/ui/Modal';
import { useToast } from '@/shared/ui/ToastProvider';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { SettingsSecuritySection } from '@/features/dashboard/settings/SettingsSecuritySection';
import { SettingsExportSection } from '@/features/dashboard/settings/SettingsExportSection';
import { SettingsDangerZone } from '@/features/dashboard/settings/SettingsDangerZone';
import { SettingsPreferencesSection } from '@/features/dashboard/settings/SettingsPreferencesSection';
import { SettingsHeroSkeleton } from '@/shared/ui/Skeleton';

type ProfileData = DashboardProfile;

export function SettingsView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { refresh } = useSession();
    const { showToast } = useToast();
    const { profile: panelProfile } = useDashboardPanel();
    const [profile, setProfile] = useState<ProfileData | null>(
        () => (panelProfile as ProfileData | null) ?? null
    );
    const [loading, setLoading] = useState(() => !panelProfile);
    const [keyVisible, setKeyVisible] = useState(false);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [keyMaskedHint, setKeyMaskedHint] = useState<string | null>(null);
    const [postRegenKey, setPostRegenKey] = useState<string | null>(null);
    const [revealLoading, setRevealLoading] = useState(false);
    const [showDanger, setShowDanger] = useState(false);
    const [regenOpen, setRegenOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const keyHideTimerRef = useRef<number | null>(null);
    const pollRef = useRef<number | null>(null);
    const [dangerModal, setDangerModal] = useState<{
        title: string;
        desc: string;
        word: string;
        confirmLabel?: string;
        action: () => Promise<void>;
    } | null>(null);
    const dangerZoneRef = useRef<HTMLDivElement>(null);

    const KEY_PLACEHOLDER = 'sk_a••••••••••••';
    const displayedKey = keyVisible && revealedKey ? revealedKey : keyMaskedHint || KEY_PLACEHOLDER;

    const clearRevealedKey = useCallback(() => {
        setRevealedKey(null);
        setKeyVisible(false);
        if (keyHideTimerRef.current) {
            window.clearTimeout(keyHideTimerRef.current);
            keyHideTimerRef.current = null;
        }
    }, []);

    const revealFromServer = useCallback(async (): Promise<string | null> => {
        if (revealedKey) return revealedKey;
        setRevealLoading(true);
        try {
            const data = await fetchRevealApiKey();
            setRevealedKey(data.apiKey);
            setKeyMaskedHint(data.masked);
            return data.apiKey;
        } catch (e) {
            showToast((e as Error).message || 'No se pudo revelar la API Key', 'error');
            return null;
        } finally {
            setRevealLoading(false);
        }
    }, [revealedKey, showToast]);

    const syncProfile = async (options?: { silent?: boolean; fresh?: boolean }) => {
        if (!session.login) {
            setLoading(false);
            return;
        }
        if (!options?.silent && !profile) setLoading(true);
        try {
            const data = await fetchDashboardProfile(session, { fresh: options?.fresh });
            setProfile(data);
            writePanelSyncPref(session.userId, Date.now().toString());
        } catch {
            showToast('Error al cargar perfil', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Si el panel ya trajo perfil (Home/Analytics), reutilizarlo sin USER_INFO extra.
    useEffect(() => {
        if (!panelProfile) return;
        setProfile((prev) => prev ?? (panelProfile as ProfileData));
        setLoading(false);
    }, [panelProfile]);

    useEffect(() => {
        return () => {
            if (keyHideTimerRef.current) window.clearTimeout(keyHideTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!active) clearRevealedKey();
    }, [active, clearRevealedKey]);

    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') clearRevealedKey();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [clearRevealedKey]);

    useEffect(() => {
        if (!active) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
            return;
        }

        const pollMs = PROFILE_POLL_MS;
        const lastSyncRaw = readPanelSyncPref(session.userId);
        const elapsed = lastSyncRaw ? Date.now() - parseInt(lastSyncRaw, 10) : Number.POSITIVE_INFINITY;
        const hasFreshPanelProfile = Boolean(panelProfile) && elapsed < pollMs;

        if (!hasFreshPanelProfile) {
            void syncProfile({ silent: Boolean(panelProfile || profile) });
        } else {
            setLoading(false);
        }

        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            const since = Date.now() - parseInt(readPanelSyncPref(session.userId) || '0', 10);
            if (since >= pollMs) {
                void syncProfile({ silent: true });
            }
        }, pollMs);

        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.login, active]);

    useEffect(() => {
        if (!showDanger || !dangerZoneRef.current) return;

        let raf = 0;
        const timer = window.setTimeout(() => {
            const start = window.scrollY;
            const target = document.documentElement.scrollHeight - window.innerHeight;
            const distance = target - start;
            if (distance <= 0) return;

            const duration = 2600;
            let startTime: number | null = null;

            const easeInOutQuart = (t: number, b: number, c: number, d: number) => {
                t /= d / 2;
                if (t < 1) return (c / 2) * t * t * t * t + b;
                t -= 2;
                return (-c / 2) * (t * t * t * t - 2) + b;
            };

            const animation = (currentTime: number) => {
                if (startTime === null) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const nextY = easeInOutQuart(Math.min(elapsed, duration), start, distance, duration);
                window.scrollTo(0, nextY);
                if (elapsed < duration) {
                    raf = requestAnimationFrame(animation);
                } else {
                    window.scrollTo(0, target);
                }
            };

            raf = requestAnimationFrame(animation);
        }, 550);

        return () => {
            window.clearTimeout(timer);
            cancelAnimationFrame(raf);
        };
    }, [showDanger]);

    const regenerateKey = async () => {
        try {
            const res = await fetchWithRetry(API_ENDPOINTS.REGENERATE_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
            });

            if (res.status === 403) {
                showToast('Sesión inválida o CSRF rechazado. Recarga la página.', 'error');
                return;
            }
            if (!res.ok) {
                showToast('Error al regenerar API Key', 'error');
                return;
            }

            const data = (await res.json()) as { apiKey?: string };
            if (data.apiKey) {
                setKeyMaskedHint(maskApiKey(data.apiKey));
                setPostRegenKey(data.apiKey);
                clearRevealedKey();
                showToast('Nueva API Key generada', 'success');
                void refresh();
            }
        } catch {
            showToast('Error al regenerar API Key', 'error');
        }
    };

    const revealKeyTemporarily = async () => {
        if (keyVisible) {
            clearRevealedKey();
            return;
        }
        const key = await revealFromServer();
        if (!key) return;
        setKeyVisible(true);
        if (keyHideTimerRef.current) clearTimeout(keyHideTimerRef.current);
        keyHideTimerRef.current = window.setTimeout(() => clearRevealedKey(), 30000);
    };

    const parseJsonSafe = async (res: Response): Promise<Record<string, unknown>> => {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return {};
        try {
            return (await res.json()) as Record<string, unknown>;
        } catch {
            return {};
        }
    };

    const clearData = async () => {
        try {
            const res = await fetchWithRetry(API_ENDPOINTS.CLEAR_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ confirm: 'LIMPIAR' })
            });
            const data = await parseJsonSafe(res);
            if (res.ok && data.success) {
                clearDashboardSyncPrefs(session.userId);
                if (session.userId) broadcastHomeDataReset(session.userId);
                writePanelSyncPref(session.userId, Date.now().toString());
                showToast((data.message as string) ?? 'Datos limpiados', 'success');
            } else {
                showToast(extractApiErrorMessage(data, 'No se pudieron limpiar los datos'), 'error');
            }
        } catch {
            showToast('Error de conexión al limpiar los datos', 'error');
        }
    };

    const deleteAccount = async () => {
        try {
            const res = await fetchWithRetry(API_ENDPOINTS.DELETE_ACCOUNT, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ confirm: 'ELIMINAR' })
            });
            const data = await parseJsonSafe(res);
            if (res.ok && data.success) {
                showToast('Cuenta eliminada. Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = appPath('/');
                }, 2000);
            } else {
                showToast(extractApiErrorMessage(data, 'No se pudo eliminar la cuenta'), 'error');
            }
        } catch {
            showToast('Error de conexión al eliminar la cuenta', 'error');
        }
    };

    const copyKey = async () => {
        const key = revealedKey || (await revealFromServer());
        if (!key) return;
        await navigator.clipboard.writeText(key);
        showToast('API Key copiada', 'success');
    };

    const copyId = async () => {
        if (!session.userId) return;
        await navigator.clipboard.writeText(session.userId);
        showToast('ID copiado', 'success');
    };

    if (loading && !profile) {
        return (
            <div className={fadeIn}>
                <SettingsHeroSkeleton />
            </div>
        );
    }

    return (
        <div className={fadeIn}>
            <SettingsSecuritySection
                apiKey={displayedKey}
                keyVisible={keyVisible}
                keyLoading={revealLoading}
                showDanger={showDanger}
                userId={session.userId}
                rateLimit={profile?.rateLimit ?? 60}
                cacheTtl={profile?.cacheTtl ?? 60}
                roleLabel={profile?.roleLabel ?? 'Default'}
                hasCustomRateLimit={profile?.hasCustomRateLimit}
                hasCustomCacheTtl={profile?.hasCustomCacheTtl}
                onToggleKey={() => void revealKeyTemporarily()}
                onCopyKey={() => void copyKey()}
                onRegenKey={() => setRegenOpen(true)}
                onToggleDanger={() => setShowDanger((v) => !v)}
                onCopyId={() => void copyId()}
            />

            <SettingsPreferencesSection
                currentTimezone={profile?.timezone || 'UTC'}
                onSettingsChanged={() => void syncProfile({ silent: true, fresh: true })}
            />

            <SettingsExportSection
                loading={exportLoading}
                onExport={async () => {
                    setExportLoading(true);
                    try {
                        const res = await fetchWithRetry(API_ENDPOINTS.EXPORT_CHECK, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                        });

                        if (res.status === 429) {
                            const data = (await res.json()) as { error?: string };
                            showToast(
                                extractApiErrorMessage(data, 'Debes esperar para generar otro reporte.'),
                                'warning'
                            );
                            return;
                        }
                        if (!res.ok) {
                            showToast('Error de conexión al verificar límite.', 'error');
                            return;
                        }

                        const { DataExport } = await import('@/features/dashboard/lib/dataExporter');
                        await DataExport.export(session, (msg) => showToast(msg, 'success'));

                        await fetchWithRetry(API_ENDPOINTS.EXPORT_COMPLETE, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                        });
                    } catch {
                        showToast('Error de conexión.', 'error');
                    } finally {
                        setExportLoading(false);
                    }
                }}
            />

            <SettingsDangerZone
                ref={dangerZoneRef}
                visible={showDanger}
                onClearData={() =>
                    setDangerModal({
                        title: 'Reiniciar Estadísticas',
                        desc: 'Esta acción borrará todo el historial de comandos, clips y latencia. Tu cuenta y API Key seguirán activas.',
                        word: 'LIMPIAR',
                        confirmLabel: 'Confirmar y Borrar',
                        action: clearData
                    })
                }
                onDeleteAccount={() =>
                    setDangerModal({
                        title: 'Eliminar Perfil de LosPerris API',
                        desc: '¡ATENCIÓN! Esta acción es irreversible dentro de nuestra plataforma. Se borrarán tus datos y API Key. Esto NO afectará a tu canal ni cuenta de Twitch de ninguna manera.',
                        word: 'ELIMINAR',
                        confirmLabel: 'Confirmar y Borrar',
                        action: deleteAccount
                    })
                }
            />

            <RegenKeyModal open={regenOpen} onClose={() => setRegenOpen(false)} onConfirm={regenerateKey} />

            <PostRegenKeyModal
                open={!!postRegenKey}
                apiKey={postRegenKey || ''}
                onClose={() => setPostRegenKey(null)}
            />

            <DangerConfirmModal
                open={!!dangerModal}
                onClose={() => setDangerModal(null)}
                title={dangerModal?.title ?? ''}
                description={dangerModal?.desc ?? ''}
                confirmWord={dangerModal?.word ?? ''}
                confirmLabel={dangerModal?.confirmLabel}
                onConfirm={dangerModal?.action ?? (async () => {})}
            />
        </div>
    );
}
