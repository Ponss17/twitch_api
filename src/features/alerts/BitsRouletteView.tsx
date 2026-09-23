import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gift, Plus, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { OverlayUrlButton } from '@/features/overlay/components/OverlayUrlButton';
import { ToolPanelHeader } from '@/features/tools/components/ToolPanelHeader';
import { SelectField } from '@/shared/ui/SelectField';
import { BitsRouletteSkeleton } from '@/shared/ui/skeletons/BitsRouletteSkeleton';
import { btnSecondary, toolPanelShell, toolConfigInput } from '@/core/utils/tw';
import { useToolFocus } from '@/features/dashboard/lib/ui/ToolFocusContext';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import {
    BITS_ROULETTE_OPTIONS_MIN,
    BITS_ROULETTE_PREF,
    DEFAULT_BITS_ROULETTE_URL,
    maxBitsRouletteOptionsForRole,
    normalizePrizeOptions,
    type BitsMatchMode,
    type BitsRouletteUrlConfig
} from '@/features/alerts/bitsRouletteUrl';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';

interface BitsAlertSubscription {
    enabled: boolean;
    eventsubId: string | null;
}

function readUrlConfig(userId?: string, maxOptions?: number): BitsRouletteUrlConfig {
    try {
        const raw = readScopedPref(BITS_ROULETTE_PREF, userId);
        if (!raw) return { ...DEFAULT_BITS_ROULETTE_URL };
        const parsed = JSON.parse(raw) as Partial<BitsRouletteUrlConfig>;
        return {
            threshold: Number(parsed.threshold) || DEFAULT_BITS_ROULETTE_URL.threshold,
            matchMode: parsed.matchMode === 'min' ? 'min' : 'exact',
            options: normalizePrizeOptions(parsed.options, maxOptions),
            cooldownSec: Number(parsed.cooldownSec) || DEFAULT_BITS_ROULETTE_URL.cooldownSec,
            announceChat: parsed.announceChat === true
        };
    } catch {
        return { ...DEFAULT_BITS_ROULETTE_URL };
    }
}

export function BitsRouletteView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { profile } = useDashboardPanel();
    const { t } = useTranslation();
    const aT = t.alerts.bitsRoulette;
    const { showToast } = useToast();
    const { focusMode } = useToolFocus();

    const maxOptions = useMemo(() => {
        if (typeof profile?.maxBitsRouletteOptions === 'number') {
            return profile.maxBitsRouletteOptions;
        }
        return maxBitsRouletteOptionsForRole(profile?.role);
    }, [profile?.maxBitsRouletteOptions, profile?.role]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const initial = useMemo(
        () => readUrlConfig(session.userId, maxOptions),
        [session.userId, maxOptions]
    );
    const [threshold, setThreshold] = useState(initial.threshold);
    const [matchMode, setMatchMode] = useState<BitsMatchMode>(initial.matchMode);
    const [options, setOptions] = useState<string[]>(initial.options);
    const [cooldownSec, setCooldownSec] = useState(initial.cooldownSec);
    const [announceChat, setAnnounceChat] = useState(initial.announceChat);

    const persistUrlConfig = useCallback(
        (next: BitsRouletteUrlConfig) => {
            writeScopedPref(BITS_ROULETTE_PREF, session.userId, JSON.stringify(next));
        },
        [session.userId]
    );

    useEffect(() => {
        if (!active) return;
        let cancelled = false;
        void (async () => {
            try {
                const data = await apiFetch<{ subscription: BitsAlertSubscription }>(
                    API_ENDPOINTS.ALERTS_BITS_ROULETTE,
                    session,
                    { method: 'GET' }
                );
                if (cancelled) return;
                setEnabled(Boolean(data.subscription?.enabled));
                const cfg = readUrlConfig(session.userId, maxOptions);
                setThreshold(cfg.threshold);
                setMatchMode(cfg.matchMode);
                setOptions(cfg.options);
                setCooldownSec(cfg.cooldownSec);
                setAnnounceChat(cfg.announceChat);
            } catch {
                if (!cancelled) showToast(aT.loadError, 'error');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // Solo al abrir la pestaña / cambiar de usuario — no en cada re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- session/showToast identity flapea y vaciaba el panel
    }, [active, session.userId, maxOptions]);

    useEffect(() => {
        setOptions((prev) => {
            if (prev.length <= maxOptions) return prev;
            return prev.slice(0, maxOptions);
        });
    }, [maxOptions]);

    const saveLocalConfig = () => {
        const cleaned = normalizePrizeOptions(options, maxOptions);
        if (cleaned.length < BITS_ROULETTE_OPTIONS_MIN) {
            showToast(aT.optionsMin, 'warning');
            return;
        }
        const next: BitsRouletteUrlConfig = {
            threshold,
            matchMode,
            options: cleaned,
            cooldownSec,
            announceChat
        };
        setOptions(cleaned);
        persistUrlConfig(next);
        showToast(aT.savedLocal, 'success');
    };

    const toggleEnabled = async (nextEnabled: boolean) => {
        setSaving(true);
        try {
            const data = await apiFetch<{
                subscription: BitsAlertSubscription;
                localOnly?: boolean;
                message?: string;
            }>(API_ENDPOINTS.ALERTS_BITS_ROULETTE, session, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: nextEnabled })
            });
            setEnabled(Boolean(data.subscription?.enabled));
            if (data.localOnly && data.message) {
                showToast(data.message, 'info');
            } else {
                showToast(nextEnabled ? aT.enabledOn : aT.enabledOff, 'success');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : aT.saveError;
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const testSpin = async () => {
        setTesting(true);
        try {
            await apiFetch(API_ENDPOINTS.ALERTS_BITS_ROULETTE_TEST, session, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bits: threshold })
            });
            showToast(aT.testOk, 'success');
        } catch (err) {
            const msg = err instanceof Error ? err.message : aT.testError;
            showToast(msg, 'error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <BitsRouletteSkeleton />;
    }

    return (
        <div className={toolPanelShell(focusMode)}>
            <ToolPanelHeader
                icon={Gift}
                title={aT.title}
                description={aT.desc}
                primaryAction={<OverlayUrlButton tool="bits-roulette" />}
            />

            <div className="flex flex-col gap-6 p-5">
            <div className="grid gap-6 lg:grid-cols-2">
                <section className="space-y-4 rounded-xl border border-border-subtle bg-bg-secondary/40 p-4">
                    <h3 className="text-sm font-semibold text-text-main">{aT.triggerTitle}</h3>
                    <label
                        className={`flex cursor-pointer items-center gap-2 text-sm text-text-main ${
                            saving ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={enabled}
                            disabled={saving}
                            onChange={(e) => void toggleEnabled(e.target.checked)}
                            className="size-4 shrink-0 accent-primary"
                        />
                        {aT.enabled}
                    </label>

                    <div className="flex flex-wrap gap-3">
                        <label className="block text-xs text-text-muted">
                            {aT.threshold}
                            <input
                                type="number"
                                min={1}
                                max={100000}
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value) || 1)}
                                className={`${toolConfigInput} mt-1 w-28`}
                            />
                        </label>
                        <label className="block text-xs text-text-muted">
                            {aT.matchMode}
                            <div className="mt-1">
                                <SelectField
                                    value={matchMode}
                                    onChange={(e) =>
                                        setMatchMode(e.target.value as BitsMatchMode)
                                    }
                                    aria-label={aT.matchMode}
                                    options={[
                                        { value: 'exact', label: aT.matchExact },
                                        { value: 'min', label: aT.matchMin }
                                    ]}
                                />
                            </div>
                        </label>
                        <label className="block text-xs text-text-muted">
                            {aT.cooldown}
                            <input
                                type="number"
                                min={5}
                                max={3600}
                                value={cooldownSec}
                                onChange={(e) => setCooldownSec(Number(e.target.value) || 45)}
                                className={`${toolConfigInput} mt-1 w-24`}
                            />
                        </label>
                    </div>
                    <label
                        className={`flex cursor-pointer items-start gap-2 text-sm text-text-main ${
                            saving ? 'opacity-50' : ''
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={announceChat}
                            onChange={(e) => setAnnounceChat(e.target.checked)}
                            className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span>
                            {aT.announceChat}
                            <span className="mt-0.5 block text-xs font-normal text-text-muted">
                                {aT.announceChatHint}
                            </span>
                        </span>
                    </label>
                    <p className="text-xs text-text-muted">{aT.triggerHint}</p>
                </section>

                <section className="space-y-3 rounded-xl border border-border-subtle bg-bg-secondary/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-text-main">{aT.optionsTitle}</h3>
                            <p className="text-[0.7rem] text-text-muted">
                                {aT.optionsMaxHint
                                    .replace('{max}', String(maxOptions))
                                    .replace('{plan}', profile?.roleLabel || 'Default')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setOptions((prev) =>
                                    prev.length >= maxOptions
                                        ? prev
                                        : [...prev, `Premio ${prev.length + 1}`]
                                )
                            }
                            disabled={options.length >= maxOptions}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-text hover:bg-primary/10 disabled:opacity-40"
                        >
                            <Plus className="size-3.5" aria-hidden />
                            {aT.addOption}
                        </button>
                    </div>
                    <ul className="space-y-2">
                        {options.map((opt, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={opt}
                                    maxLength={40}
                                    onChange={(e) =>
                                        setOptions((prev) =>
                                            prev.map((item, i) =>
                                                i === index ? e.target.value : item
                                            )
                                        )
                                    }
                                    className={`${toolConfigInput} flex-1`}
                                    aria-label={`${aT.optionsTitle} ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOptions((prev) =>
                                            prev.length <= BITS_ROULETTE_OPTIONS_MIN
                                                ? prev
                                                : prev.filter((_, i) => i !== index)
                                        )
                                    }
                                    disabled={options.length <= BITS_ROULETTE_OPTIONS_MIN}
                                    className="rounded-lg p-2 text-text-muted hover:bg-white/[0.04] hover:text-text-main disabled:opacity-40"
                                    aria-label={aT.removeOption}
                                >
                                    <Trash2 className="size-3.5" aria-hidden />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={saveLocalConfig}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                    {aT.save}
                </button>
                <button
                    type="button"
                    onClick={() => void testSpin()}
                    disabled={testing}
                    className={btnSecondary}
                >
                    {testing ? aT.testing : aT.testSpin}
                </button>
            </div>
            </div>
        </div>
    );
}
