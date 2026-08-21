import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, ExternalLink, X } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { buildClipEmbedSrc } from '@/features/clips/lib/clipEmbed';
import { buildClipVodUrl, formatClipDuration } from '@/features/clips/lib/clipMedia';
import type { Clip } from '@/features/clips/hooks/useClips';

interface ClipPlayerOverlayProps {
    clip: Clip;
    embedSession: number;
    onClose: () => void;
    onDownload?: () => void;
}

export function ClipPlayerOverlay({ clip, embedSession, onClose, onDownload }: ClipPlayerOverlayProps) {
    const { t } = useTranslation();
    const overlayT = t.clips.overlay;
    const clipsT = t.clips;
    const duration = formatClipDuration(clip.duration);
    const vodUrl = buildClipVodUrl(clip.video_id, clip.vod_offset);

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
                aria-label={clip.title ?? overlayT.player}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 border-b border-border-strong bg-text-main/5 px-5 py-4">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[1.05rem] font-bold text-text-main">
                            {clip.title ?? overlayT.defaultTitle}
                        </p>
                        <p className="mt-0.5 truncate text-[0.75rem] text-text-muted">
                            {[
                                clip.creator_name
                                    ? clipsT.byCreator.replace('{name}', clip.creator_name)
                                    : null,
                                duration
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {onDownload ? (
                            <button
                                type="button"
                                onClick={onDownload}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 text-[0.75rem] font-medium text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                                title={clipsT.download}
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{clipsT.download}</span>
                            </button>
                        ) : null}
                        {vodUrl ? (
                            <a
                                href={vodUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 text-[0.75rem] font-medium text-text-muted no-underline transition hover:bg-white/[0.02] hover:text-text-main"
                                title={clipsT.openVod}
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{clipsT.openVod}</span>
                            </a>
                        ) : null}
                        <a
                            href={clip.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 text-[0.75rem] font-medium text-text-muted no-underline transition hover:bg-white/[0.02] hover:text-text-main"
                            title={overlayT.openTwitch}
                        >
                            <span className="hidden sm:inline">{overlayT.openTwitch}</span>
                            <ExternalLink className="h-3.5 w-3.5 sm:hidden" />
                        </a>
                        <button
                            type="button"
                            onClick={onClose}
                            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-text-muted transition hover:border-border-subtle hover:bg-white/[0.02] hover:text-text-main"
                            aria-label={overlayT.close}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="relative aspect-video w-full bg-black">
                    <iframe
                        key={`${clip.id}-${embedSession}`}
                        title={clip.title ?? overlayT.defaultTitle}
                        src={buildClipEmbedSrc(clip.id)}
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-none"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
