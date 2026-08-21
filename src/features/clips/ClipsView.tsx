import { useState } from 'react';
import { ClipsGridSkeleton } from '@/shared/ui/Skeleton';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { panelCard, fadeIn, textInput, hoverSubtleControl, hoverSubtleBorderedRow } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { ClipPlayerOverlay } from '@/features/clips/ClipPlayerOverlay';
import { SelectField } from '@/shared/ui/SelectField';
import { ClipCommandView } from '@/features/clips/ClipCommandView';
import {
    Star,
    RotateCw,
    Link as LinkIcon,
    Images,
    Search,
    Play,
    Download,
    FileSpreadsheet,
    ExternalLink
} from 'lucide-react';
import { useTranslation, getBcp47 } from '@/core/i18n/I18nContext';
import { formatDate } from '@/core/utils/utils';
import { ITEMS_PER_PAGE, useClips, type Clip } from '@/features/clips/hooks/useClips';
import {
    buildClipVodUrl,
    formatClipDuration
} from '@/features/clips/lib/clipMedia';

const CLIPS_GRID =
    'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5 max-[600px]:grid-cols-1';

const CLIP_CARD =
    'group/card relative overflow-hidden rounded-xl border border-border-strong bg-bg-secondary transition-all duration-200 hover:border-primary/10 hover:bg-primary/[0.015]';

const CLIP_OVERLAY_BTN =
    'flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white/70 backdrop-blur-[2px] transition hover:bg-primary/20 hover:text-white';

const CLIP_TOOLBAR_BTN = (active = false) =>
    `flex h-8 w-8 items-center justify-center rounded-md border transition ${
        active
            ? 'border-primary/40 bg-primary/15 text-primary'
            : `border-border-strong bg-text-main/5 text-text-muted ${hoverSubtleControl} hover:text-text-main`
    }`;

const CLIPS_SEARCH = `${textInput} pl-9`;

interface ClipThumbnailProps {
    src: string;
    alt?: string;
    isAboveFold?: boolean;
    isPriority?: boolean;
}

function ClipThumbnail({ src, alt = '', isAboveFold = false, isPriority = false }: ClipThumbnailProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative aspect-video w-full overflow-hidden bg-bg-secondary">
            {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-text-main/5" />
            )}
            <img
                src={src}
                alt={alt}
                loading={isAboveFold ? 'eager' : 'lazy'}
                fetchPriority={isPriority ? 'high' : undefined}
                onLoad={() => setIsLoaded(true)}
                className={`aspect-video w-full object-cover transition-all duration-500 ease-out group-hover/card:scale-105 group-hover/card:brightness-[0.9] ${
                    isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-[2px]'
                }`}
            />
        </div>
    );
}

export function ClipsView({ active = true }: { active?: boolean }) {
    const { t, locale } = useTranslation();
    const clipsT = t.clips;
    const {
        CLIPS_SORT_OPTIONS,
        favorites,
        loading,
        loadingMore,
        search,
        sort,
        showFavsOnly,
        setShowFavsOnly,
        filtered,
        visible,
        hasMore,
        loadMore,
        reload,
        onSearchChange,
        onSortChange,
        toggleFavorite,
        copyUrl,
        downloadClip,
        exportCsv
    } = useClips({ active });

    const [playingClip, setPlayingClip] = useState<Clip | null>(null);
    const [embedSession, setEmbedSession] = useState(0);

    const openClipPlayer = (clip: Clip) => {
        setPlayingClip(clip);
        setEmbedSession((n) => n + 1);
    };

    const closeClipPlayer = () => {
        setPlayingClip(null);
    };

    return (
        <>
            <ClipCommandView />

            <div className={`${panelCard} ${fadeIn} mb-3 flex flex-col [animation-delay:60ms]`}>
                <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}>
                            <Images className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">
                                {clipsT.title}
                            </h2>
                            <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">
                                {clipsT.info}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={exportCsv}
                            title={clipsT.btnExportCsv}
                            aria-label={clipsT.btnExportCsv}
                            className={CLIP_TOOLBAR_BTN()}
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowFavsOnly((v) => !v)}
                            title={clipsT.btnFavsOnly}
                            aria-pressed={showFavsOnly}
                            className={CLIP_TOOLBAR_BTN(showFavsOnly)}
                        >
                            <Star className={`h-3.5 w-3.5 ${showFavsOnly ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={reload}
                            title={clipsT.btnReload}
                            className={CLIP_TOOLBAR_BTN()}
                        >
                            <RotateCw className="h-3.5 w-3.5" />
                        </button>
                        <InfoTooltip text={clipsT.tooltip} />
                    </div>
                </header>

                <div className="p-5 text-text-main">
                    <div className="mb-5 flex flex-wrap gap-[15px] max-[600px]:flex-col">
                        <div className="relative min-w-[200px] flex-1">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[0.8125rem] text-text-muted w-3.5 h-3.5"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={clipsT.searchPlaceholder}
                                aria-label={clipsT.searchPlaceholder}
                                className={CLIPS_SEARCH}
                            />
                        </div>
                        <div className="shrink-0 max-[600px]:w-full">
                            <SelectField
                                value={sort}
                                onChange={(e) => onSortChange(e.target.value)}
                                aria-label={clipsT.sortLabel}
                                className="max-[600px]:w-full max-[600px]:max-w-none"
                                options={[...CLIPS_SORT_OPTIONS]}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <ClipsGridSkeleton count={6} className={CLIPS_GRID} />
                    ) : filtered.length === 0 ? (
                        <p className="py-8 text-center text-[0.8125rem] text-text-muted">
                            {clipsT.noClips}
                        </p>
                    ) : (
                        <>
                            <div className={CLIPS_GRID}>
                                {visible.map((clip, index) => {
                                    const isFav = favorites.includes(clip.id);
                                    const bcp47 = getBcp47(locale);
                                    const viewsStr =
                                        clip.view_count != null
                                            ? clip.view_count.toLocaleString(bcp47)
                                            : '0';
                                    const dateStr = formatDate(clip.created_at ?? '', locale);
                                    const durationStr = formatClipDuration(clip.duration);
                                    const vodUrl = buildClipVodUrl(clip.video_id, clip.vod_offset);
                                    const isAboveFold = index < 6;

                                    return (
                                        <article
                                            key={clip.id}
                                            className={`${CLIP_CARD} animate-reveal-card opacity-0`}
                                            style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 60}ms` }}
                                        >
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => openClipPlayer(clip)}
                                                    className="group/thumb relative block w-full cursor-pointer border-none bg-transparent p-0 text-left"
                                                    aria-label={clipsT.playClip(clip.title ?? clip.id)}
                                                >
                                                    {clip.thumbnail_url ? (
                                                        <>
                                                            <ClipThumbnail
                                                                src={clip.thumbnail_url}
                                                                alt=""
                                                                isAboveFold={isAboveFold}
                                                                isPriority={index === 0}
                                                            />
                                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover/card:opacity-100">
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white/85 backdrop-blur-[2px]">
                                                                    <Play
                                                                        className="ml-0.5 h-3.5 w-3.5"
                                                                        fill="currentColor"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex aspect-video w-full items-center justify-center bg-black/30 text-[0.75rem] font-medium text-text-muted">
                                                            {clipsT.viewClip}
                                                        </div>
                                                    )}
                                                </button>

                                                {durationStr ? (
                                                    <span className="pointer-events-none absolute bottom-2 left-2 z-[1] rounded bg-black/65 px-1.5 py-0.5 font-mono text-[0.65rem] text-white">
                                                        {durationStr}
                                                    </span>
                                                ) : null}

                                                <div className="absolute top-2 right-2 z-[2] flex flex-wrap justify-end gap-1 opacity-0 transition duration-200 group-hover/card:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void downloadClip(clip);
                                                        }}
                                                        title={clipsT.download}
                                                        className={CLIP_OVERLAY_BTN}
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(clip.id);
                                                        }}
                                                        title={clipsT.favorite}
                                                        aria-pressed={isFav}
                                                        className={`${CLIP_OVERLAY_BTN} ${isFav ? 'text-primary' : ''}`}
                                                    >
                                                        <Star
                                                            className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`}
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void copyUrl(clip.url);
                                                        }}
                                                        title={clipsT.copyLink}
                                                        className={CLIP_OVERLAY_BTN}
                                                    >
                                                        <LinkIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                {isFav ? (
                                                    <Star
                                                        className="pointer-events-none absolute top-2 right-2 z-[1] h-3.5 w-3.5 fill-primary/80 text-primary/80 opacity-70 group-hover/card:opacity-0"
                                                        aria-hidden
                                                    />
                                                ) : null}
                                            </div>

                                            <div className="p-3">
                                                <a
                                                    href={clip.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mb-1 block truncate text-[0.8125rem] font-semibold text-text-main no-underline transition-colors hover:text-brand-text hover:underline"
                                                    title={clip.title ?? clipsT.untitled}
                                                >
                                                    {clip.title ?? clipsT.untitled}
                                                </a>
                                                {clip.creator_name ? (
                                                    <p className="mb-1.5 truncate text-[0.6875rem] text-text-muted">
                                                        {clipsT.byCreator.replace('{name}', clip.creator_name)}
                                                    </p>
                                                ) : null}
                                                <div className="flex items-center justify-between gap-2 text-[0.6875rem] text-text-muted">
                                                    <span className="truncate">{viewsStr} {clipsT.views}</span>
                                                    <span className="flex shrink-0 items-center gap-1.5">
                                                        <span>{dateStr}</span>
                                                        {vodUrl ? (
                                                            <a
                                                                href={vodUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title={clipsT.openVod}
                                                                aria-label={clipsT.openVod}
                                                                className="inline-flex text-text-muted transition hover:text-brand-text"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        ) : null}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            {hasMore && (
                                <button
                                    type="button"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className={`mt-6 w-full rounded-lg border border-border-subtle bg-bg-secondary py-2.5 text-[0.8125rem] font-semibold text-text-muted ${hoverSubtleBorderedRow}`}
                                >
                                    {clipsT.loadMore}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {playingClip ? (
                <ClipPlayerOverlay
                    clip={playingClip}
                    embedSession={embedSession}
                    onClose={closeClipPlayer}
                    onDownload={() => void downloadClip(playingClip)}
                />
            ) : null}
        </>
    );
}
