import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { clipPlayerPanel } from '@/core/ui/tw';
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
                className={clipPlayerPanel}
                role="dialog"
                aria-modal="true"
                aria-label={title ?? 'Reproductor de clip'}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-black/85 to-transparent p-3">
                    <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-white">
                        {title ?? 'Clip de Twitch'}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:border-primary hover:bg-primary"
                        aria-label="Cerrar reproductor"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <iframe
                    key={`${clipId}-${embedSession}`}
                    title={title ?? 'Clip de Twitch'}
                    src={buildClipEmbedSrc(clipId)}
                    allowFullScreen
                    className="absolute inset-0 h-full w-full min-h-[300px] border-none bg-black"
                />
            </div>
        </div>,
        document.body
    );
}
