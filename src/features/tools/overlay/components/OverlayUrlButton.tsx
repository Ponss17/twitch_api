import { Layers, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { OverlaySetupModal } from '@/features/tools/overlay/components/OverlaySetupModal';
import { fetchOverlayLink } from '@/features/tools/overlay/lib/sync';
import type { OverlayTool } from '@/features/tools/overlay/lib/types';
import { useToast } from '@/shared/ui/ToastProvider';

export function OverlayUrlButton({ tool }: { tool: OverlayTool }) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialUrl, setInitialUrl] = useState('');

    const handleClick = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const url = await fetchOverlayLink(tool, session);
            if (!url) {
                showToast('No se pudo generar la URL del overlay', 'error');
                return;
            }
            await navigator.clipboard.writeText(url);
            setInitialUrl(url);
            setOpen(true);
            showToast('URL del overlay copiada', 'success');
        } catch {
            showToast('No se pudo copiar la URL', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => void handleClick()}
                disabled={loading}
                title="Copiar URL y ver guía de overlay"
                aria-label="Copiar URL del overlay"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[0.75rem] font-semibold text-[#c4c4cc] transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                ) : (
                    <Layers className="size-3.5 shrink-0" aria-hidden />
                )}
                {loading ? '…' : 'Overlay'}
            </button>
            <OverlaySetupModal
                open={open}
                onClose={() => setOpen(false)}
                tool={tool}
                initialUrl={initialUrl}
            />
        </>
    );
}
