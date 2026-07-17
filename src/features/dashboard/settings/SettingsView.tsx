import { useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials, fetchRevealApiKey, clearRevealedApiKeyCache, cacheRevealedApiKey } from '@/core/api/auth';
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
import { DangerConfirmModal, RegenKeyModal } from '@/shared/ui/Modal';
import { useToast } from '@/shared/ui/ToastProvider';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsSecuritySection } from '@/features/dashboard/settings/SettingsSecuritySection';
import { SettingsDiscordSection } from '@/features/dashboard/settings/SettingsDiscordSection';
import {
    DiscordLinkConfirmModal,
    DiscordUnlinkConfirmModal,
    DiscordResultModal,
    type DiscordResultKind
} from '@/features/dashboard/settings/DiscordLinkModals';
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
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [keyVisible, setKeyVisible] = useState(false);
    const [showDanger, setShowDanger] = useState(false);
    const [regenOpen, setRegenOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [discordBusy, setDiscordBusy] = useState(false);
    const [discordLinkOpen, setDiscordLinkOpen] = useState(false);
    const [discordUnlinkOpen, setDiscordUnlinkOpen] = useState(false);
    const [discordResult, setDiscordResult] = useState<DiscordResultKind | null>(null);
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
            const res = await fetchWithRetry(API_ENDPOINTS.REGENERATE_KEY, withApiCredentials({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
            }));

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
                clearRevealedApiKeyCache();
                cacheRevealedApiKey({
                    apiKey: data.apiKey,
                    masked: maskApiKey(data.apiKey)
                });
                setRevealedKey(data.apiKey);
                setKeyVisible(true);
                if (keyHideTimerRef.current) clearTimeout(keyHideTimerRef.current);
                keyHideTimerRef.current = window.setTimeout(() => {
                    setKeyVisible(false);
                    setRevealedKey(null);
                    clearRevealedApiKeyCache();
                }, 30000);
                showToast('Nueva API Key generada', 'success');
                void refresh();
            }
        } catch {
            showToast('Error al regenerar API Key', 'error');
        }
    };

    const revealKeyTemporarily = async () => {
        try {
            const result = await fetchRevealApiKey();
            setRevealedKey(result.apiKey);
            setKeyVisible(true);
            if (keyHideTimerRef.current) clearTimeout(keyHideTimerRef.current);
            keyHideTimerRef.current = window.setTimeout(() => {
                setKeyVisible(false);
                setRevealedKey(null);
                clearRevealedApiKeyCache();
            }, 30000);
        } catch (e) {
            showToast((e as Error).message || 'No se pudo revelar la API Key', 'error');
        }
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
            const res = await fetchWithRetry(API_ENDPOINTS.CLEAR_DATA, withApiCredentials({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ confirm: 'LIMPIAR' })
            }));
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
            const res = await fetchWithRetry(API_ENDPOINTS.DELETE_ACCOUNT, withApiCredentials({
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ confirm: 'ELIMINAR' })
            }));
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
        try {
            const key = revealedKey || (await fetchRevealApiKey()).apiKey;
            setRevealedKey(key);
            await navigator.clipboard.writeText(key);
            showToast('API Key copiada', 'success');
        } catch {
            showToast('No se pudo copiar la API Key', 'error');
        }
    };

    const copyId = async () => {
        if (!session.userId) return;
        await navigator.clipboard.writeText(session.userId);
        showToast('ID copiado', 'success');
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const discord = params.get('discord');
        if (!discord) return;

        const known: DiscordResultKind[] = [
            'linked',
            'error_taken',
            'error_auth',
            'error_config',
            'error'
        ];
        const kind = (known.includes(discord as DiscordResultKind)
            ? discord
            : 'error') as DiscordResultKind;

        setDiscordResult(kind);
        showToast(
            kind === 'linked'
                ? 'Discord vinculado correctamente'
                : kind === 'error_taken'
                  ? 'Ese Discord ya está vinculado a otra cuenta'
                  : kind === 'error_auth'
                    ? 'Debes iniciar sesión para vincular Discord'
                    : kind === 'error_config'
                      ? 'La vinculación con Discord no está disponible ahora'
                      : 'No se pudo vincular Discord',
            kind === 'linked' ? 'success' : 'error'
        );

        params.delete('discord');
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState({}, '', next);

        if (kind === 'linked') {
            void syncProfile({ silent: true, fresh: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con query
    }, []);

    const startDiscordLink = () => {
        setDiscordLinkOpen(false);
        window.location.href = API_ENDPOINTS.AUTH_DISCORD_LINK;
    };

    const unlinkDiscord = async () => {
        setDiscordBusy(true);
        try {
            const res = await fetchWithRetry(
                API_ENDPOINTS.AUTH_DISCORD_UNLINK,
                withApiCredentials({ method: 'POST' })
            );
            if (!res.ok) {
                setDiscordResult('error');
                showToast('No se pudo desvincular Discord', 'error');
                return;
            }
            setDiscordResult('unlinked');
            showToast('Discord desvinculado', 'success');
            await syncProfile({ silent: true, fresh: true });
        } catch {
            setDiscordResult('error');
            showToast('Error de conexión al desvincular', 'error');
        } finally {
            setDiscordBusy(false);
        }
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
            <SettingsGroup
                title="Seguridad"
                description="Credenciales privadas de tu cuenta"
                delay={60}
            >
                <SettingsSecuritySection
                    apiKey={keyVisible && revealedKey ? revealedKey : maskApiKey(revealedKey || '••••••••••••••••')}
                    keyVisible={keyVisible}
                    showDanger={showDanger}
                    userId={session.userId}
                    rateLimit={profile?.rateLimit ?? 60}
                    cacheTtl={profile?.cacheTtl ?? 60}
                    roleLabel={profile?.roleLabel ?? 'Default'}
                    hasCustomRateLimit={profile?.hasCustomRateLimit}
                    hasCustomCacheTtl={profile?.hasCustomCacheTtl}
                    onToggleKey={() => {
                        if (keyVisible) {
                            setKeyVisible(false);
                            setRevealedKey(null);
                            clearRevealedApiKeyCache();
                        } else {
                            void revealKeyTemporarily();
                        }
                    }}
                    onCopyKey={() => void copyKey()}
                    onRegenKey={() => setRegenOpen(true)}
                    onToggleDanger={() => setShowDanger((v) => !v)}
                    onCopyId={() => void copyId()}
                />
            </SettingsGroup>

            <SettingsGroup
                title="Conexiones"
                description="Servicios vinculados a tu cuenta de LosPerris"
                delay={80}
            >
                <SettingsDiscordSection
                    discordId={profile?.discordId}
                    discordUsername={profile?.discordUsername}
                    discordAvatar={profile?.discordAvatar}
                    busy={discordBusy}
                    onLinkClick={() => setDiscordLinkOpen(true)}
                    onUnlinkClick={() => setDiscordUnlinkOpen(true)}
                />
            </SettingsGroup>

            <SettingsGroup title="Preferencias" description="Ajustes de tu cuenta" delay={90}>
                <SettingsPreferencesSection
                    currentTimezone={profile?.timezone || 'UTC'}
                    onSettingsChanged={() => void syncProfile({ silent: true, fresh: true })}
                />
            </SettingsGroup>

            <SettingsGroup title="Datos" description="Exporta la información de tu cuenta" delay={120}>
                <SettingsExportSection
                    loading={exportLoading}
                    onExport={async () => {
                    setExportLoading(true);
                    try {
                        const res = await fetchWithRetry(API_ENDPOINTS.EXPORT_CHECK, withApiCredentials({
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                        }));

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

                        await fetchWithRetry(API_ENDPOINTS.EXPORT_COMPLETE, withApiCredentials({
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                        }));
                    } catch {
                        showToast('Error de conexión.', 'error');
                    } finally {
                        setExportLoading(false);
                    }
                }}
                />
            </SettingsGroup>

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

            <DiscordLinkConfirmModal
                open={discordLinkOpen}
                onClose={() => setDiscordLinkOpen(false)}
                onConfirm={startDiscordLink}
            />

            <DiscordUnlinkConfirmModal
                open={discordUnlinkOpen}
                busy={discordBusy}
                username={profile?.discordUsername}
                onClose={() => setDiscordUnlinkOpen(false)}
                onConfirm={unlinkDiscord}
            />

            <DiscordResultModal
                open={discordResult != null}
                kind={discordResult}
                onClose={() => setDiscordResult(null)}
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
