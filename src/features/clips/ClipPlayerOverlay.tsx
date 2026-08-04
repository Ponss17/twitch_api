import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';

import { buildClipEmbedSrc } from '@/features/clips/lib/clipEmbed';

interface ClipPlayerOverlayProps {
    clipId: string;
    title?: string;
    embedSession: number;
    onClose: () => void;
}

export function ClipPlayerOverlay({ clipId, title, embedSession, onClose }: ClipPlayerOverlayProps) {
    const { t } = useTranslation();
    const overlayT = t.clips.overlay;

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
                className="w-full max-w-5xl overflow-hidden rounded-xl border border-border-strong bg-bg-modal animate-fade-soft shadow-lg"
                role="dialog"
                aria-modal="true"
                aria-label={title ?? overlayT.player}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border-strong bg-text-main/5 px-5 py-4">
                    <p className="min-w-0 flex-1 truncate text-[1.05rem] font-bold text-text-main">
                        {title ?? overlayT.defaultTitle}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-text-muted transition hover:border-border-subtle hover:bg-bg-hover-neutral hover:text-text-main"
                        aria-label={overlayT.close}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative aspect-video w-full bg-black">
                    <iframe
                        key={`${clipId}-${embedSession}`}
                        title={title ?? overlayT.defaultTitle}
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
