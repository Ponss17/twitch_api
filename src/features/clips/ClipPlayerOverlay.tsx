import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { buildClipEmbedSrc } from '@/features/clips/lib/clipEmbed';

interface ClipPlayerOverlayProps {
    clipId: string;
    title?: string;
    embedSession: number;
    onClose: () => void;
}

export function ClipPlayerOverlay({ clipId, title, embedSession, onClose }: ClipPlayerOverlayProps) {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl overflow-hidden rounded-xl border border-white/[0.08] bg-[#09090b] animate-fade-soft shadow-lg"
                role="dialog"
                aria-modal="true"
                aria-label={title ?? 'Reproductor de clip'}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-5 py-4">
                    <p className="min-w-0 flex-1 truncate text-[1.05rem] font-bold text-[#fafafa]">
                        {title ?? 'Clip de Twitch'}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-white/70 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                        aria-label="Cerrar reproductor"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative aspect-video w-full bg-black">
                    <iframe
                        key={`${clipId}-${embedSession}`}
                        title={title ?? 'Clip de Twitch'}
                        src={buildClipEmbedSrc(clipId)}
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-none"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
