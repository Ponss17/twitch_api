import { Copy, Check, Layers, Link2, Loader2, Monitor, Radio } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { codeBox, modalBtnPrimary } from '@/core/ui/tw';
import { fetchOverlayLink } from '@/features/tools/overlay/lib/sync';
import {
    getOverlayPlatformGuide,
    maskOverlayUrlForDisplay,
    OVERLAY_SETUP_VERSION,
    overlayToolLabel,
    type OverlayPlatform
} from '@/features/tools/overlay/lib/overlaySetupGuide';
import type { OverlayTool } from '@/features/tools/overlay/lib/types';
import { Modal } from '@/shared/ui/Modal';
import { useToast } from '@/shared/ui/ToastProvider';

interface OverlaySetupModalProps {
    open: boolean;
    onClose: () => void;
    tool: OverlayTool;
}

const PLATFORMS: { id: OverlayPlatform; label: string; icon: typeof Monitor }[] = [
    { id: 'obs', label: 'OBS', icon: Monitor },
    { id: 'streamlabs', label: 'Streamlabs', icon: Radio }
];

export function OverlaySetupModal({ open, onClose, tool }: OverlaySetupModalProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [platform, setPlatform] = useState<OverlayPlatform>('obs');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copied, setCopied] = useState(false);

    const guide = getOverlayPlatformGuide(tool, platform);
    const toolLabel = overlayToolLabel(tool);
    const displayUrl = maskOverlayUrlForDisplay(url);

    const loadUrl = useCallback(async () => {
        setLoading(true);
        try {
            const next = await fetchOverlayLink(tool, session);
            if (!next) {
                showToast('No se pudo generar la URL del overlay', 'error');
                setUrl('');
                return;
            }
            setUrl(next);
        } catch {
            showToast('No se pudo generar la URL del overlay', 'error');
            setUrl('');
        } finally {
            setLoading(false);
        }
    }, [session, showToast, tool]);

    useEffect(() => {
        if (!open) return;
        setPlatform('obs');
        setCopied(false);
        void loadUrl();
    }, [open, loadUrl]);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 2000);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const copyUrl = async () => {
        if (!url || copying) return;
        setCopying(true);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            showToast('URL del overlay copiada', 'success');
        } catch {
            showToast('No se pudo copiar la URL', 'error');
        } finally {
            setCopying(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Overlay — ${toolLabel}`}
            titleIcon={Layers}
            titleBadge={OVERLAY_SETUP_VERSION}
            footer={
                <button
                    type="button"
                    className={modalBtnPrimary}
                    disabled={!url || copying}
                    onClick={() => void copyUrl()}
                >
                    {copying ? (
                        <>
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            Copiando…
                        </>
                    ) : copied ? (
                        <>
                            <Check className="size-4 shrink-0" aria-hidden />
                            Copiado
                        </>
                    ) : (
                        <>
                            <Copy className="size-4 shrink-0" aria-hidden />
                            Copiar URL
                        </>
                    )}
                </button>
            }
        >
            <p className="mb-3 text-[0.8125rem] leading-snug text-[#a1a1aa]">
                Añade la URL como fuente de navegador en tu software de streaming.
            </p>

            <div className="mb-3">
                <p className="mb-1.5 text-[0.6875rem] font-semibold tracking-wide text-[#71717a] uppercase">
                    Enlace
                </p>
                <div className={`${codeBox} flex items-center gap-2 py-2`}>
                    {loading ? (
                        <div className="flex min-h-[28px] flex-1 items-center gap-2 text-[0.8125rem] text-[#71717a]">
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            Generando…
                        </div>
                    ) : (
                        <>
                            <Link2 className="size-3.5 shrink-0 text-primary/70" aria-hidden />
                            <p
                                className="min-w-0 flex-1 truncate font-[Consolas,monospace] text-[0.75rem] text-[#fafafa]"
                                title={displayUrl}
                            >
                                {displayUrl || '—'}
                            </p>
                        </>
                    )}
                </div>
                <p className="mt-1 text-[0.6875rem] text-[#71717a]">
                    El token va incluido al copiar. No compartas el enlace en público.
                </p>
            </div>

            <div
                className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-white/[0.08] bg-black/25 p-1"
                role="tablist"
                aria-label="Plataforma de streaming"
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
                            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[0.75rem] font-semibold transition ${
                                selected
                                    ? 'bg-primary text-white'
                                    : 'text-[#c4c4cc] hover:bg-white/5 hover:text-[#fafafa]'
                            }`}
                        >
                            <Icon className="size-3 shrink-0" aria-hidden />
                            {label}
                        </button>
                    );
                })}
            </div>

            <div role="tabpanel" className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                <h4 className="mb-2 text-[0.8125rem] font-semibold text-[#fafafa]">{guide.title}</h4>
                <ol className="space-y-2">
                    {guide.steps.map((step, index) => (
                        <li key={step.title} className="flex gap-2 text-[0.75rem] leading-snug">
                            <span
                                className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.625rem] font-bold text-primary"
                                aria-hidden
                            >
                                {index + 1}
                            </span>
                            <span className="text-[#c4c4cc]">
                                <span className="font-semibold text-[#fafafa]">{step.title}</span>
                                {' — '}
                                {step.detail}
                            </span>
                        </li>
                    ))}
                </ol>
                <p className="mt-2.5 border-t border-white/[0.06] pt-2 text-[0.6875rem] leading-snug text-[#71717a]">
                    {guide.note}
                </p>
            </div>
        </Modal>
    );
}
