import { Copy, Check, Loader2, Monitor, Radio, Info, AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { fetchOverlayLink } from '@/features/overlay/lib/sync';
import {
    getOverlayPlatformGuide,
    overlayToolLabel,
    type OverlayPlatform
} from '@/features/overlay/lib/overlaySetupGuide';
import type { OverlayTool } from '@/features/overlay/lib/types';
import { Sheet } from '@/shared/ui/Sheet';
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
        <Sheet
            open={open}
            onClose={onClose}
            title={`Overlay — ${toolLabel}`}
            description="Sigue las instrucciones para conectar el overlay a tu software de streaming."
            footer={
                <div className="flex w-full flex-col gap-3 pt-2">
                    <p className="flex items-start gap-2 text-[0.7rem] leading-relaxed text-zinc-500">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-yellow-500/70" />
                        <span>
                            La URL lleva tu token secreto.{' '}
                            <strong className="text-zinc-300">No la compartas públicamente.</strong>
                        </span>
                    </p>
                    <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[0.8rem] font-semibold text-white shadow-[0_0_20px_rgba(145,70,255,0.2)] transition-all hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(145,70,255,0.3)] disabled:pointer-events-none disabled:opacity-50"
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
                                ¡Copiado al Portapapeles!
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
            <div className="flex flex-col gap-6 pt-1 pb-1">
                {/* Clean Platform Switcher */}
                <div
                    className="flex w-full items-center gap-1 rounded-xl border border-white/[0.04] bg-[#09090b] p-1"
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
                                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-[0.75rem] font-medium transition-all ${
                                    selected
                                        ? 'bg-white/[0.03] text-white shadow-sm border border-white/[0.04]'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01] border border-transparent'
                                }`}
                            >
                                <Icon className={`size-3.5 shrink-0 ${selected ? 'text-primary' : ''}`} aria-hidden />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Flat List Card for Steps */}
                <div role="tabpanel" className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-5 py-5">
                    <h4 className="mb-4 text-[0.7rem] font-bold tracking-widest text-zinc-500 uppercase">
                        {guide.title}
                    </h4>
                    <ol className="flex flex-col gap-4">
                        {guide.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-4 text-[0.75rem] leading-relaxed">
                                <div
                                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-[0.65rem] font-bold text-zinc-400"
                                    aria-hidden
                                >
                                    {index + 1}
                                </div>
                                <div>
                                    <strong className="block pb-0.5 font-semibold text-[#e4e4e7]">{step.title}</strong>
                                    <span className="text-zinc-500">{step.detail}</span>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-white/[0.02] bg-[#09090b] p-3">
                        <Info className="mt-0.5 size-4 shrink-0 text-primary/70" />
                        <p className="text-[0.7rem] leading-relaxed text-zinc-500">{guide.note}</p>
                    </div>
                </div>
            </div>
        </Sheet>
    );
}
