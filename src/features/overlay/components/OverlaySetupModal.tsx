import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { fetchOverlayLink } from '@/features/overlay/lib/sync';
import {
    getOverlayPlatformGuide,
    type OverlayPlatform
} from '@/features/overlay/lib/overlaySetupGuide';
import type { OverlayTool } from '@/features/overlay/lib/types';
import { Sheet } from '@/shared/ui/Sheet';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import { resolveWheelPalette, ROULETTE_COLOR_PRESETS } from '@/features/tools/roulette/lib/wheelUtils';
import { appendOverlayAppearanceParams, isOverlayScaleId, type OverlayScaleId } from '@/features/overlay/lib/overlayAppearance';
import {
    appendBitsRouletteParams,
    BITS_WINNER_HOLD_MAX_SEC,
    BITS_WINNER_HOLD_MIN_SEC,
    DEFAULT_BITS_SPIN_BANNER,
    normalizeSpinBanner,
    normalizeWinnerHoldSec,
    type BitsRouletteUrlConfig,
    type BitsWinnerCardStyle
} from '@/features/alerts/lib/bitsRouletteUrl';
import { patchBitsRoulettePrefs, readBitsRoulettePrefs } from '@/features/alerts/lib/bitsRoulettePrefs';
import {
    BITS_CONFETTI_SOUND_IDS,
    normalizeConfettiSound,
    playBitsConfettiSound
} from '@/features/alerts/lib/bitsConfettiSound';
import { copyText } from '@/core/utils/clipboard';
import {
    modalBtnPrimary,
    themeActiveChip,
    themeActiveChoice,
    themeIdleChip,
    themeIdleChoice,
    toolConfigInput
} from '@/core/utils/tw';
import { SelectField } from '@/shared/ui/SelectField';

interface OverlaySetupModalProps {
    open: boolean;
    onClose: () => void;
    tool: OverlayTool;
}

const PLATFORMS: { id: OverlayPlatform; label: string }[] = [
    { id: 'obs', label: 'OBS' },
    { id: 'streamlabs', label: 'Streamlabs' }
];

const OBS_ROULETTE_COLOR_PREF = 'roulette_obs_wheel_color';
const OBS_OVERLAY_SCALE_PREF = 'overlay_obs_scale';

function overlayColorPrefKey(tool: OverlayTool): string {
    return tool === 'roulette' || tool === 'bits-roulette'
        ? OBS_ROULETTE_COLOR_PREF
        : `overlay_obs_color_${tool}`;
}

function overlayScalePrefKey(tool: OverlayTool): string {
    return `${OBS_OVERLAY_SCALE_PREF}_${tool}`;
}

export function OverlaySetupModal({ open, onClose, tool }: OverlaySetupModalProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const mT = t.overlay.setupModal;
    const gT = t.overlay.guide;
    const aT = t.overlay.appearance;
    const bitsT = t.alerts.bitsRoulette;
    const [platform, setPlatform] = useState<OverlayPlatform>('obs');
    const [rawUrl, setRawUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copied, setCopied] = useState(false);

    const [obsWheelColor, setObsWheelColor] = useState<string>(() =>
        readScopedPref(overlayColorPrefKey(tool), session.userId) || 'auto'
    );
    const [obsScale, setObsScale] = useState<OverlayScaleId>(() => {
        const stored = readScopedPref(overlayScalePrefKey(tool), session.userId);
        return stored && isOverlayScaleId(stored) ? stored : 'md';
    });
    const [bitsConfig, setBitsConfig] = useState<BitsRouletteUrlConfig>(() =>
        readBitsRoulettePrefs(session.userId)
    );
    const spinBannerInputRef = useRef<HTMLInputElement>(null);

    const guide = useMemo(
        () => getOverlayPlatformGuide(tool, platform, gT, obsScale),
        [tool, platform, gT, obsScale]
    );
    const toolLabel = gT.tools[tool] ?? tool;

    const handleColorChange = (newColor: string) => {
        setObsWheelColor(newColor);
        writeScopedPref(overlayColorPrefKey(tool), session.userId, newColor);
    };

    const handleScaleChange = (next: OverlayScaleId) => {
        setObsScale(next);
        writeScopedPref(overlayScalePrefKey(tool), session.userId, next);
    };

    const finalUrl = useMemo(() => {
        let url = appendOverlayAppearanceParams(rawUrl, {
            color: obsWheelColor,
            scale: obsScale
        });
        if (tool === 'bits-roulette') {
            url = appendBitsRouletteParams(url, bitsConfig);
        }
        return url;
    }, [rawUrl, obsWheelColor, obsScale, tool, bitsConfig]);

    const updateBits = (patch: Partial<BitsRouletteUrlConfig>) => {
        setBitsConfig(patchBitsRoulettePrefs(session.userId, patch));
    };

    const insertSpinBannerVar = (token: string) => {
        const el = spinBannerInputRef.current;
        const current = bitsConfig.spinBanner || '';
        if (!el) {
            updateBits({
                spinBanner: normalizeSpinBanner(`${current}${token}`)
            });
            return;
        }
        const start = el.selectionStart ?? current.length;
        const end = el.selectionEnd ?? current.length;
        const next = normalizeSpinBanner(
            `${current.slice(0, start)}${token}${current.slice(end)}`
        );
        updateBits({ spinBanner: next });
        requestAnimationFrame(() => {
            const pos = Math.min(start + token.length, next.length);
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    };

    const loadUrl = useCallback(async () => {
        setLoading(true);
        try {
            const next = await fetchOverlayLink(tool, session);
            if (!next) {
                showToast(mT.generateError, 'error');
                setRawUrl('');
                return;
            }
            setRawUrl(next);
        } catch {
            showToast(mT.generateError, 'error');
            setRawUrl('');
        } finally {
            setLoading(false);
        }
    }, [session, showToast, tool, mT.generateError]);

    useEffect(() => {
        if (!open) return;
        setPlatform('obs');
        setCopied(false);
        setObsWheelColor(readScopedPref(overlayColorPrefKey(tool), session.userId) || 'auto');
        const storedScale = readScopedPref(overlayScalePrefKey(tool), session.userId);
        setObsScale(storedScale && isOverlayScaleId(storedScale) ? storedScale : 'md');
        setBitsConfig(readBitsRoulettePrefs(session.userId));
        void loadUrl();
    }, [open, loadUrl, session.userId, tool]);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 2000);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const copyUrl = async () => {
        if (!finalUrl || copying) return;
        setCopying(true);
        const ok = await copyText(finalUrl);
        if (ok) {
            setCopied(true);
            showToast(mT.copySuccess, 'success');
        } else {
            showToast(mT.copyError, 'error');
        }
        setCopying(false);
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={`${mT.titlePrefix} ${toolLabel}`}
            description={mT.description}
            footer={
                <div className="flex w-full flex-col gap-3">
                    <p className="text-[0.7rem] leading-relaxed text-text-muted">
                        {mT.warning}{' '}
                        <strong className="text-text-main">{mT.warningBold}</strong>
                    </p>
                    <button
                        type="button"
                        className={modalBtnPrimary}
                        disabled={!finalUrl || loading || copying}
                        onClick={() => void copyUrl()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                {mT.generating}
                            </>
                        ) : copying ? (
                            <>
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                {mT.copying}
                            </>
                        ) : copied ? (
                            mT.copied
                        ) : (
                            mT.copySrc
                        )}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-5 pt-1 pb-1">
                <div
                    className="flex w-full items-center gap-1 rounded-xl border border-border-subtle bg-bg-secondary p-1"
                    role="tablist"
                    aria-label={t.common.aria.streamingPlatform}
                >
                    {PLATFORMS.map(({ id, label }) => {
                        const selected = platform === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                onClick={() => setPlatform(id)}
                                className={`flex-1 rounded-lg py-2.5 text-[0.75rem] font-medium ${
                                    selected ? themeActiveChip : themeIdleChip
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-xl border border-border-subtle bg-bg-secondary/70 p-4 shadow-xs backdrop-blur-xs">
                    <div className="flex items-center justify-between gap-2 pb-2">
                        <h4 className="text-[0.75rem] font-bold text-text-main">{aT.title}</h4>
                        <span className="rounded-md border border-border-subtle bg-bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-text-muted">
                            {aT.badge}
                        </span>
                    </div>
                    <p className="mb-3 text-[0.7rem] leading-relaxed text-text-muted">{aT.desc}</p>

                    <p className="mb-2 text-[0.7rem] font-semibold text-text-muted">{aT.colorLabel}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {ROULETTE_COLOR_PRESETS.map((preset) => {
                            const isSelected = obsWheelColor === preset.id;
                            const palette = resolveWheelPalette(preset.id);
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleColorChange(preset.id)}
                                    title={preset.label}
                                    className={`group relative flex items-center gap-2 overflow-hidden rounded-lg px-2.5 py-2 text-left text-[0.7rem] font-medium ${
                                        isSelected ? themeActiveChoice : themeIdleChoice
                                    }`}
                                >
                                    <span
                                        className="size-3.5 shrink-0 rounded-full border border-white/20"
                                        style={{ backgroundColor: preset.isAuto ? 'var(--primary)' : palette.primaryHex }}
                                    />
                                    <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                                        <span className="inline-block whitespace-nowrap transition-transform duration-700 ease-out group-hover:-translate-x-1/3">
                                            {preset.label}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2">
                        <span className="text-[0.7rem] text-text-muted">{aT.customColor}</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                aria-label={aT.customColor}
                                value={obsWheelColor.startsWith('#') ? obsWheelColor : '#9146ff'}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                            />
                            <span className="font-mono text-[0.7rem] uppercase text-text-main">
                                {obsWheelColor.startsWith('#') ? obsWheelColor : aT.preset}
                            </span>
                        </div>
                    </div>

                    <p className="mt-4 mb-2 text-[0.7rem] font-semibold text-text-muted">{aT.scaleLabel}</p>
                    <div className="grid grid-cols-3 gap-2">
                        {(['sm', 'md', 'lg'] as const).map((id) => {
                            const selected = obsScale === id;
                            const label = id === 'sm' ? aT.scaleSm : id === 'lg' ? aT.scaleLg : aT.scaleMd;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => handleScaleChange(id)}
                                    className={`rounded-lg px-2 py-2 text-[0.7rem] font-medium ${
                                        selected ? themeActiveChoice : themeIdleChoice
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {tool === 'bits-roulette' ? (
                        <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
                            <p className="text-[0.7rem] font-semibold text-text-muted">
                                {bitsT.appearanceTitle}
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="flex items-center gap-2 text-[0.75rem] text-text-main">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(bitsConfig.spinBanner)}
                                        onChange={(e) =>
                                            updateBits({
                                                spinBanner: e.target.checked
                                                    ? normalizeSpinBanner(
                                                          bitsConfig.spinBanner ||
                                                              bitsT.spinBannerDefault ||
                                                              DEFAULT_BITS_SPIN_BANNER
                                                      )
                                                    : ''
                                            })
                                        }
                                        aria-label={bitsT.spinBanner}
                                        className="size-3.5 shrink-0 accent-primary"
                                    />
                                    <span className="select-none">{bitsT.spinBanner}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[0.75rem] text-text-main">
                                    <input
                                        type="checkbox"
                                        checked={bitsConfig.showDonor}
                                        onChange={(e) =>
                                            updateBits({ showDonor: e.target.checked })
                                        }
                                        aria-label={bitsT.showDonor}
                                        className="size-3.5 shrink-0 accent-primary"
                                    />
                                    <span className="select-none">{bitsT.showDonor}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[0.75rem] text-text-main sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={bitsConfig.confetti}
                                        onChange={(e) => {
                                            const on = e.target.checked;
                                            updateBits({
                                                confetti: on,
                                                ...(on && bitsConfig.confettiSound === 'none'
                                                    ? { confettiSound: 'confetti' as const }
                                                    : {})
                                            });
                                        }}
                                        aria-label={bitsT.confetti}
                                        className="size-3.5 shrink-0 accent-primary"
                                    />
                                    <span className="select-none">{bitsT.confetti}</span>
                                </div>
                            </div>
                            {bitsConfig.spinBanner ? (
                                <div className="space-y-1">
                                    <label className="block text-[0.7rem] text-text-muted">
                                        {bitsT.spinBannerText}
                                        <input
                                            ref={spinBannerInputRef}
                                            type="text"
                                            value={bitsConfig.spinBanner}
                                            maxLength={80}
                                            onChange={(e) =>
                                                updateBits({
                                                    spinBanner: normalizeSpinBanner(
                                                        e.target.value
                                                    )
                                                })
                                            }
                                            placeholder={
                                                bitsT.spinBannerDefault ||
                                                DEFAULT_BITS_SPIN_BANNER
                                            }
                                            className={`${toolConfigInput} mt-1`}
                                        />
                                    </label>
                                    <small className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[0.6875rem] leading-snug text-text-muted">
                                        <strong className="text-text-main">
                                            {bitsT.spinBannerVars}
                                        </strong>
                                        {(['{name}', '{bits}'] as const).map((token) => (
                                            <button
                                                key={token}
                                                type="button"
                                                onClick={() => insertSpinBannerVar(token)}
                                                title={bitsT.spinBannerInsertVar.replace(
                                                    '{var}',
                                                    token
                                                )}
                                                aria-label={bitsT.spinBannerInsertVar.replace(
                                                    '{var}',
                                                    token
                                                )}
                                                className="rounded border border-primary/30 bg-primary/15 px-1.5 py-0.5 font-mono text-[0.8125rem] font-medium text-brand-text transition-colors hover:border-primary/50 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                                            >
                                                {token}
                                            </button>
                                        ))}
                                    </small>
                                </div>
                            ) : null}
                            <label className="block text-[0.7rem] text-text-muted">
                                {bitsT.confettiSound}
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="min-w-0 flex-1">
                                        <SelectField
                                            value={bitsConfig.confettiSound}
                                            onChange={(e) =>
                                                updateBits({
                                                    confettiSound: normalizeConfettiSound(
                                                        e.target.value
                                                    )
                                                })
                                            }
                                            aria-label={bitsT.confettiSound}
                                            options={BITS_CONFETTI_SOUND_IDS.map((id) => ({
                                                value: id,
                                                label: bitsT.confettiSounds[id]
                                            }))}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        disabled={bitsConfig.confettiSound === 'none'}
                                        onClick={() =>
                                            playBitsConfettiSound(bitsConfig.confettiSound)
                                        }
                                        className="shrink-0 rounded-md border border-border-subtle px-2 py-1.5 text-[0.7rem] font-medium text-text-main transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {bitsT.confettiSoundPreview}
                                    </button>
                                </div>
                                <span className="mt-1 block text-[0.65rem] leading-snug text-text-muted">
                                    {bitsT.confettiSoundHint}
                                </span>
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="block text-[0.7rem] text-text-muted">
                                    {bitsT.cardStyle}
                                    <div className="mt-1">
                                        <SelectField
                                            value={bitsConfig.cardStyle}
                                            onChange={(e) =>
                                                updateBits({
                                                    cardStyle: e.target
                                                        .value as BitsWinnerCardStyle
                                                })
                                            }
                                            aria-label={bitsT.cardStyle}
                                            options={[
                                                { value: 'glass', label: bitsT.cardGlass },
                                                { value: 'solid', label: bitsT.cardSolid }
                                            ]}
                                        />
                                    </div>
                                </label>
                                <label className="block text-[0.7rem] text-text-muted">
                                    {bitsT.winnerHold}
                                    <input
                                        type="number"
                                        min={BITS_WINNER_HOLD_MIN_SEC}
                                        max={BITS_WINNER_HOLD_MAX_SEC}
                                        step={1}
                                        value={bitsConfig.winnerHoldSec}
                                        onChange={(e) =>
                                            updateBits({
                                                winnerHoldSec: normalizeWinnerHoldSec(
                                                    e.target.value
                                                )
                                            })
                                        }
                                        aria-label={bitsT.winnerHold}
                                        className={`${toolConfigInput} mt-1 w-full`}
                                    />
                                    <span className="mt-1 block text-[0.65rem] leading-snug text-text-muted">
                                        {bitsT.winnerHoldHint}
                                    </span>
                                </label>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div role="tabpanel" className="rounded-xl border border-border-subtle bg-bg-secondary/70 px-5 py-5 shadow-xs backdrop-blur-xs">
                    <h4 className="mb-4 text-[0.7rem] font-bold tracking-widest text-text-muted uppercase">
                        {guide.title}
                    </h4>
                    <ol className="flex flex-col gap-4">
                        {guide.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-4 text-[0.75rem] leading-relaxed">
                                <div
                                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.07] text-[0.65rem] font-bold text-primary"
                                    aria-hidden
                                >
                                    {index + 1}
                                </div>
                                <div>
                                    <strong className="block pb-0.5 font-semibold text-text-main">{step.title}</strong>
                                    <span className="text-text-muted">{step.detail}</span>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <p className="mt-5 rounded-lg border border-border-subtle bg-bg-main/50 p-3 text-[0.7rem] leading-relaxed text-text-muted">
                        {guide.note}
                    </p>
                </div>
            </div>
        </Sheet>
    );
}
