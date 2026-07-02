import { useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, saveSession } from '@/core/api/auth';
import { fetchDashboardProfile } from '@/features/dashboard/lib/dashboardSummary';
import {
    broadcastHomeDataReset,
    clearDashboardSyncPrefs,
    PROFILE_POLL_MS,
    readPanelSyncPref,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { useRequiredSession, useSession } from '@/core/session/useSession';
import { maskApiKey } from '@/core/ui/utils';
import { DataExport } from '@/features/dashboard/lib/dataExporter';
import { fadeIn } from '@/core/ui/tw';
import { appPath } from '@/core/config/paths';
import { DangerConfirmModal, RegenKeyModal } from '@/shared/ui/Modal';
import { useToast } from '@/shared/ui/ToastProvider';
import { ProfileHero } from '@/features/dashboard/components/profile/ProfileHero';
import { ProfileSecuritySection } from '@/features/dashboard/components/profile/ProfileSecuritySection';
import { ProfileExportSection } from '@/features/dashboard/components/profile/ProfileExportSection';
import { ProfileDangerZone } from '@/features/dashboard/components/profile/ProfileDangerZone';
import { ProfileHeroSkeleton } from '@/shared/ui/Skeleton';

interface ProfileData {
    followers?: number;
    broadcaster_type?: string;
    description?: string;
    created_at?: string;
    rateLimit?: number;
    cacheTtl?: number;
    role?: string;
    roleLabel?: string;
    hasCustomRateLimit?: boolean;
    hasCustomCacheTtl?: boolean;
}


function formatMemberSince(iso?: string): string {
    if (!iso) return '---';
    try {
        return new Date(iso).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return '---';
    }
}

function broadcasterLabel(type?: string): string {
    if (type === 'partner') return 'Partner';
    if (type === 'affiliate') return 'Afiliado';
    return 'Streamer';
}

export function ProfileView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { refresh } = useSession();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [keyVisible, setKeyVisible] = useState(false);
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

    const apiKey = session.apiKey || session.token || '';

    const syncProfile = async (options?: { silent?: boolean; fresh?: boolean }) => {
        if (!session.login) {
            setLoading(false);
            return;
        }
        if (!options?.silent) setLoading(true);
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

    const startProfilePolling = () => {
        const pollMs = PROFILE_POLL_MS;
        void syncProfile();

        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            const elapsed = Date.now() - parseInt(readPanelSyncPref(session.userId) || '0', 10);
            if (elapsed >= pollMs) {
                void syncProfile({ silent: true });
            }
        }, pollMs);
    };

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

        startProfilePolling();
        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
        };
        // startProfilePolling se recrea en cada render; incluirlo reiniciaría el
        // polling constantemente. Solo queremos (re)arrancar al cambiar de sesión o
        // al activarse la pestaña.
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
            const res = await fetch(API_ENDPOINTS.REGENERATE_KEY, {
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
                const updated = { ...session, apiKey: data.apiKey };
                saveSession(updated);
                setKeyVisible(false);
                if (keyHideTimerRef.current) clearTimeout(keyHideTimerRef.current);
                showToast('Nueva API Key generada', 'success');
                void refresh();
            }
        } catch {
            showToast('Error al regenerar API Key', 'error');
        }
    };

    const revealKeyTemporarily = () => {
        setKeyVisible(true);
        if (keyHideTimerRef.current) clearTimeout(keyHideTimerRef.current);
        keyHideTimerRef.current = window.setTimeout(() => setKeyVisible(false), 30000);
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
            const res = await fetch(API_ENDPOINTS.CLEAR_DATA, {
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
            const res = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
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
        if (!apiKey) return;
        await navigator.clipboard.writeText(apiKey);
        showToast('API Key copiada', 'success');
    };

    const copyId = async () => {
        if (!session.userId) return;
        await navigator.clipboard.writeText(session.userId);
        showToast('ID copiado', 'success');
    };

    const label = broadcasterLabel(profile?.broadcaster_type);

    if (loading && !profile) {
        return (
            <div className={fadeIn}>
                <ProfileHeroSkeleton />
            </div>
        );
    }

    return (
        <div className={fadeIn}>
            <ProfileHero
                description={profile?.description}
                followers={profile?.followers}
                broadcasterLabel={label}
                memberSince={formatMemberSince(profile?.created_at)}
            />

            <ProfileSecuritySection
                apiKey={keyVisible ? apiKey : maskApiKey(apiKey)}
                keyVisible={keyVisible}
                showDanger={showDanger}
                userId={session.userId}
                rateLimit={profile?.rateLimit ?? 60}
                cacheTtl={profile?.cacheTtl ?? 60}
                roleLabel={profile?.roleLabel ?? 'Default'}
                hasCustomRateLimit={profile?.hasCustomRateLimit}
                hasCustomCacheTtl={profile?.hasCustomCacheTtl}
                onToggleKey={() => (keyVisible ? setKeyVisible(false) : revealKeyTemporarily())}
                onCopyKey={() => void copyKey()}
                onRegenKey={() => setRegenOpen(true)}
                onToggleDanger={() => setShowDanger((v) => !v)}
                onCopyId={() => void copyId()}
            />

            <ProfileExportSection
                loading={exportLoading}
                onExport={async () => {
                    setExportLoading(true);
                    try {
                        const res = await fetch(API_ENDPOINTS.EXPORT_CHECK, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                        });
                        
                        if (res.status === 429) {
                            const data = await res.json() as { error?: string };
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

                        await DataExport.export(session, (msg) => showToast(msg, 'success'));

                        await fetch(API_ENDPOINTS.EXPORT_COMPLETE, {
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

            <ProfileDangerZone
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

            <DangerConfirmModal
                open={!!dangerModal}
                onClose={() => setDangerModal(null)}
                title={dangerModal?.title ?? ''}
                description={dangerModal?.desc ?? ''}
                confirmWord={dangerModal?.word ?? ''}
                confirmLabel={dangerModal?.confirmLabel}
                onConfirm={dangerModal?.action ?? (async () => { })}
            />
        </div>
    );
}
