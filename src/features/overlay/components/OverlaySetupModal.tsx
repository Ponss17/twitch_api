import { Copy, Check, Layers, Loader2, Monitor, Radio, Info, AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { modalBtnPrimary } from '@/core/utils/tw';
import { fetchOverlayLink } from '@/features/overlay/lib/sync';
import {
    getOverlayPlatformGuide,
    OVERLAY_SETUP_VERSION,
    overlayToolLabel,
    type OverlayPlatform
} from '@/features/overlay/lib/overlaySetupGuide';
import type { OverlayTool } from '@/features/overlay/lib/types';
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
                <div className="flex w-full flex-col gap-2.5">
                    <p className="flex items-start gap-1.5 text-[0.7rem] leading-snug text-[#71717a]">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500/80" />
                        <span>
                            La URL lleva tu token secreto.{' '}
                            <strong className="font-medium text-[#a1a1aa]">No la compartas públicamente.</strong>
                        </span>
                    </p>
                    <button
                        type="button"
                        className={modalBtnPrimary}
                        disabled={!url || loading || copying}
                        onClick={() => void copyUrl()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                Generando enlace…
                            </>
                        ) : copying ? (
                            <>
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                Copiando…
                            </>
                        ) : copied ? (
                            <>
                                <Check className="size-4 shrink-0" aria-hidden />
                                ¡Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="size-4 shrink-0" aria-hidden />
                                Copiar URL de la Fuente
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-4 pt-1 pb-1">
                <div
                    className="grid grid-cols-2 gap-1 rounded-lg border border-white/[0.08] bg-black/25 p-1"
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
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-[#c4c4cc] hover:bg-white/5 hover:text-[#fafafa]'
                                }`}
                            >
                                <Icon className="size-3.5 shrink-0" aria-hidden />
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div role="tabpanel" className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="mb-3 text-[0.8125rem] font-bold tracking-wide text-[#fafafa] uppercase opacity-90">
                        {guide.title}
                    </h4>
                    <ol className="space-y-3.5">
                        {guide.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-3 text-[0.75rem] leading-relaxed">
                                <span
                                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.625rem] font-bold text-primary ring-1 ring-primary/20"
                                    aria-hidden
                                >
                                    {index + 1}
                                </span>
                                <span className="text-[#a1a1aa]">
                                    <strong className="block pb-0.5 font-semibold text-[#e4e4e7]">{step.title}</strong>
                                    {step.detail}
                                </span>
                            </li>
                        ))}
                    </ol>

                    <div className="mt-4 flex gap-2 rounded-lg bg-black/20 p-3 ring-1 ring-white/5">
                        <Info className="mt-0.5 size-4 shrink-0 text-primary/70" />
                        <p className="text-[0.7rem] leading-snug text-[#71717a]">{guide.note}</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
