import { Copy, Check, Loader2, Monitor, Radio, Info, AlertTriangle, Palette } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { fetchOverlayLink } from '@/features/overlay/lib/sync';
import {
    getOverlayPlatformGuide,
    type OverlayPlatform
} from '@/features/overlay/lib/overlaySetupGuide';
import type { OverlayTool } from '@/features/overlay/lib/types';
import { Sheet } from '@/shared/ui/Sheet';
import { useToast } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import { resolveWheelPalette, ROULETTE_COLOR_PRESETS } from '@/features/tools/roulette/lib/wheelUtils';
import { appendOverlayAppearanceParams, isOverlayScaleId, type OverlayScaleId } from '@/features/overlay/lib/overlayAppearance';
import { copyText } from '@/core/utils/clipboard';

interface OverlaySetupModalProps {
    open: boolean;
    onClose: () => void;
    tool: OverlayTool;
}

const PLATFORMS: { id: OverlayPlatform; label: string; icon: typeof Monitor }[] = [
    { id: 'obs', label: 'OBS', icon: Monitor },
    { id: 'streamlabs', label: 'Streamlabs', icon: Radio }
];

const OBS_ROULETTE_COLOR_PREF = 'roulette_obs_wheel_color';
const OBS_OVERLAY_SCALE_PREF = 'overlay_obs_scale';

function overlayColorPrefKey(tool: OverlayTool): string {
    return tool === 'roulette' ? OBS_ROULETTE_COLOR_PREF : `overlay_obs_color_${tool}`;
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

    const guide = getOverlayPlatformGuide(tool, platform, gT);
    const toolLabel = gT.tools[tool] ?? tool;

    const handleColorChange = (newColor: string) => {
        setObsWheelColor(newColor);
        writeScopedPref(overlayColorPrefKey(tool), session.userId, newColor);
    };

    const handleScaleChange = (next: OverlayScaleId) => {
        setObsScale(next);
        writeScopedPref(overlayScalePrefKey(tool), session.userId, next);
    };

    const finalUrl = useMemo(
        () =>
            appendOverlayAppearanceParams(rawUrl, {
                color: obsWheelColor,
                scale: obsScale
            }),
        [rawUrl, obsWheelColor, obsScale]
    );

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
                <div className="flex w-full flex-col gap-3 pt-2">
                    <p className="flex items-start gap-2 text-[0.7rem] leading-relaxed text-text-muted">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-yellow-500/70" />
                        <span>
                            {mT.warning}{' '}
                            <strong className="text-text-main">{mT.warningBold}</strong>
                        </span>
                    </p>
                    <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[0.8rem] font-semibold text-white shadow-[0_0_20px_rgba(145,70,255,0.2)] transition-all hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(145,70,255,0.3)] disabled:pointer-events-none disabled:opacity-50"
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
                            <>
                                <Check className="size-4 shrink-0" aria-hidden />
                                {mT.copied}
                            </>
                        ) : (
                            <>
                                <Copy className="size-4 shrink-0" aria-hidden />
                                {mT.copySrc}
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-5 pt-1 pb-1">
                {/* Clean Platform Switcher */}
                <div
                    className="flex w-full items-center gap-1 rounded-xl border border-border-subtle bg-bg-secondary p-1"
                    role="tablist"
                    aria-label={t.common.aria.streamingPlatform}
                >
                    {PLATFORMS.map(({ id, label, icon: Icon }) => {
                        const selected = platform === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                onClick={() => setPlatform(id)}
                                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-[0.75rem] font-medium transition-all ${
                                    selected
                                        ? 'bg-primary/15 text-brand-text shadow-xs border border-primary/30'
                                        : 'text-text-muted hover:text-text-main hover:bg-primary/10 border border-transparent'
                                }`}
                            >
                                <Icon className={`size-3.5 shrink-0 ${selected ? 'text-primary' : ''}`} aria-hidden />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Color y tamaño van en la URL — sin peticiones extra a Vercel */}
                <div className="rounded-xl border border-border-subtle bg-bg-secondary/70 backdrop-blur-xs p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2 pb-2">
                        <div className="flex items-center gap-2">
                            <Palette className="size-4 text-primary" />
                            <h4 className="text-[0.75rem] font-bold text-text-main">{aT.title}</h4>
                        </div>
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
                                    className={`group relative flex items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-2 text-left text-[0.7rem] font-medium transition-all ${
                                        isSelected
                                            ? 'border-primary bg-primary/10 text-text-main shadow-xs'
                                            : 'border-border-subtle bg-bg-secondary text-text-muted hover:border-border-strong hover:text-text-main'
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
                                    {isSelected && <Check className="ml-auto size-3 shrink-0 text-primary" />}
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
                                    className={`rounded-lg border px-2 py-2 text-[0.7rem] font-medium transition-all ${
                                        selected
                                            ? 'border-primary bg-primary/10 text-text-main'
                                            : 'border-border-subtle bg-bg-secondary text-text-muted hover:border-border-strong hover:text-text-main'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Flat List Card for Steps */}
                <div role="tabpanel" className="rounded-xl border border-border-subtle bg-bg-secondary/70 backdrop-blur-xs px-5 py-5 shadow-xs">
                    <h4 className="mb-4 text-[0.7rem] font-bold tracking-widest text-text-muted uppercase">
                        {guide.title}
                    </h4>
                    <ol className="flex flex-col gap-4">
                        {guide.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-4 text-[0.75rem] leading-relaxed">
                                <div
                                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-[0.65rem] font-bold text-brand-text"
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

                    <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-border-subtle bg-bg-main/50 p-3">
                        <Info className="mt-0.5 size-4 shrink-0 text-primary/70" />
                        <p className="text-[0.7rem] leading-relaxed text-text-muted">{guide.note}</p>
                    </div>
                </div>
            </div>
        </Sheet>
    );
}
