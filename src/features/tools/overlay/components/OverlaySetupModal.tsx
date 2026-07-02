import { Copy, Layers, Loader2, Monitor, Radio } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { codeBox, codeTextarea, modalBtnPrimary } from '@/core/ui/tw';
import { fetchOverlayLink } from '@/features/tools/overlay/lib/sync';
import {
    getOverlayPlatformGuide,
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

function renderGuideLine(line: string): ReactNode {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, index) =>
        index % 2 === 1 ? (
            <strong key={index} className="font-semibold text-[#fafafa]">
                {part}
            </strong>
        ) : (
            part
        )
    );
}

export function OverlaySetupModal({ open, onClose, tool }: OverlaySetupModalProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [platform, setPlatform] = useState<OverlayPlatform>('obs');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);

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
        void loadUrl();
    }, [open, loadUrl]);

    const copyUrl = async () => {
        if (!url || copying) return;
        setCopying(true);
        try {
            await navigator.clipboard.writeText(url);
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
                    ) : (
                        <>
                            <Copy className="size-4 shrink-0" aria-hidden />
                            Copiar URL
                        </>
                    )}
                </button>
            }
        >
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
                <span className="mt-0.5 shrink-0 rounded-md border border-primary/35 bg-primary/15 px-2 py-0.5 text-[0.6875rem] font-bold tracking-wide text-primary">
                    v1.1
                </span>
                <p className="text-[0.8125rem] leading-relaxed text-[#c4c4cc]">
                    Copia la URL y añádela como fuente de navegador en tu software de streaming.
                </p>
            </div>

            <div className="mb-5">
                <p className="mb-2 text-[0.75rem] font-semibold tracking-wide text-[#c4c4cc] uppercase">
                    URL del overlay
                </p>
                <div className={`${codeBox} relative`}>
                    {loading ? (
                        <div className="flex h-[52px] items-center gap-2 px-1 text-[0.8125rem] text-[#71717a]">
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            Generando enlace…
                        </div>
                    ) : (
                        <>
                            <textarea
                                readOnly
                                value={url}
                                aria-label="URL del overlay"
                                className={`${codeTextarea} min-h-[52px] resize-none pr-12`}
                            />
                            <button
                                type="button"
                                disabled={!url || copying}
                                onClick={() => void copyUrl()}
                                title="Copiar URL"
                                aria-label="Copiar URL"
                                className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-[#c4c4cc] transition hover:border-primary/30 hover:bg-primary/15 hover:text-primary disabled:opacity-40"
                            >
                                {copying ? (
                                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                                ) : (
                                    <Copy className="size-3.5" aria-hidden />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div
                className="mb-4 grid grid-cols-2 gap-1.5 rounded-xl border border-white/[0.08] bg-black/25 p-1.5"
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
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[0.8125rem] font-semibold transition ${
                                selected
                                    ? 'bg-primary text-white shadow-[0_4px_14px_rgba(145,70,255,0.3)]'
                                    : 'text-[#c4c4cc] hover:bg-white/5 hover:text-[#fafafa]'
                            }`}
                        >
                            <Icon className="size-3.5 shrink-0" aria-hidden />
                            {label}
                        </button>
                    );
                })}
            </div>

            <div
                role="tabpanel"
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4"
            >
                <h4 className="mb-3 text-[0.875rem] font-bold text-[#fafafa]">{guide.title}</h4>
                <ol className="mb-4 list-decimal space-y-2.5 pl-5 text-[0.8125rem] leading-relaxed text-[#c4c4cc] marker:text-primary/70">
                    {guide.steps.map((step) => (
                        <li key={step}>{renderGuideLine(step)}</li>
                    ))}
                </ol>
                <ul className="space-y-2 border-t border-white/[0.06] pt-3 text-[0.8125rem] text-[#a1a1aa]">
                    {guide.tips.map((tip) => (
                        <li key={tip} className="flex gap-2 leading-relaxed">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" aria-hidden />
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
}
