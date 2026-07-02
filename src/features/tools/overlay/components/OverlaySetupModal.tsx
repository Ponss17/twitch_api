import { Copy, Layers, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { btnSecondary, codeBox, codeTextarea, modalBtnPrimary } from '@/core/ui/tw';
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
    initialUrl?: string;
}

function renderGuideLine(line: string): ReactNode {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, index) =>
        index % 2 === 1 ? (
            <strong key={index} className="text-[#fafafa]">
                {part}
            </strong>
        ) : (
            part
        )
    );
}

export function OverlaySetupModal({ open, onClose, tool, initialUrl = '' }: OverlaySetupModalProps) {
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
        if (initialUrl) {
            setUrl(initialUrl);
            setLoading(false);
            return;
        }
        void loadUrl();
    }, [open, initialUrl, loadUrl]);

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
                <>
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
                    <button type="button" className={btnSecondary} onClick={onClose}>
                        Cerrar
                    </button>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[0.6875rem] font-bold tracking-wide text-amber-300 uppercase">
                    Beta
                </span>
                <p className="text-[0.75rem] text-[#71717a]">
                    Función en pruebas — puede cambiar en próximas versiones.
                </p>
            </div>

            <div
                className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-white/[0.08] bg-black/20 p-1"
                role="tablist"
                aria-label="Plataforma de streaming"
            >
                {(['obs', 'streamlabs'] as const).map((value) => {
                    const selected = platform === value;
                    const label = value === 'obs' ? 'OBS' : 'Streamlabs';
                    return (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setPlatform(value)}
                            className={`rounded-md px-3 py-2 text-[0.8125rem] font-semibold transition ${
                                selected
                                    ? 'bg-primary text-white shadow-[0_4px_12px_rgba(145,70,255,0.25)]'
                                    : 'text-[#c4c4cc] hover:bg-white/5 hover:text-[#fafafa]'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <div role="tabpanel">
                <h4 className="mb-2 text-[0.875rem] font-bold text-[#fafafa]">{guide.title}</h4>
                <ol className="mb-4 list-decimal space-y-2 pl-5 text-[0.8125rem] text-[#c4c4cc]">
                    {guide.steps.map((step) => (
                        <li key={step}>{renderGuideLine(step)}</li>
                    ))}
                </ol>
                <ul className="mb-4 space-y-2 text-[0.8125rem] text-[#a1a1aa]">
                    {guide.tips.map((tip) => (
                        <li key={tip} className="flex gap-2">
                            <span className="text-primary" aria-hidden>
                                •
                            </span>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <p className="mb-2 text-[0.75rem] font-semibold tracking-wide text-[#c4c4cc] uppercase">
                    URL del overlay
                </p>
                <div className={codeBox}>
                    {loading ? (
                        <div className="flex h-[38px] items-center gap-2 text-[0.8125rem] text-[#71717a]">
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            Generando enlace…
                        </div>
                    ) : (
                        <textarea
                            readOnly
                            value={url}
                            aria-label="URL del overlay"
                            className={`${codeTextarea} h-auto min-h-[38px] pr-3`}
                        />
                    )}
                </div>
            </div>
        </Modal>
    );
}
