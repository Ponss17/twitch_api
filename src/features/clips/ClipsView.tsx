import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { ClipsGridSkeleton } from '@/shared/ui/Skeleton';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { cache, CACHE_TTL } from '@/core/cache/cacheService';
import { panelCard, fadeIn, textInput, hoverSubtleControl, hoverSubtleBorderedRow } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { ClipPlayerOverlay } from '@/features/clips/ClipPlayerOverlay';
import { SelectField } from '@/shared/ui/SelectField';
import { ClipCommandView } from '@/features/commands/CommandsViews';
import { Star, RotateCw, Link as LinkIcon, Images, Search, Play } from 'lucide-react';
import { useTranslation, getBcp47 } from '@/core/i18n/I18nContext';
import { formatDate } from '@/core/utils/utils';
import { copyText } from '@/core/utils/clipboard';

interface Clip {
    id: string;
    url: string;
    title?: string;
    thumbnail_url?: string;
    created_at?: string;
    view_count?: number;
}

const ITEMS_PER_PAGE = 20;

// eslint-disable-next-line
const getClipsSortOptions = (t: any) => [
    { value: 'date-desc', label: t.clips.sort.dateDesc },
    { value: 'date-asc', label: t.clips.sort.dateAsc },
    { value: 'views-desc', label: t.clips.sort.viewsDesc },
    { value: 'views-asc', label: t.clips.sort.viewsAsc }
];

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

function loadFavorites(userId: string): string[] {
    try {
        const saved = localStorage.getItem(`clips_favs_${userId}`);
        return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
        return [];
    }
}

function saveFavorites(userId: string, favorites: string[]) {
    localStorage.setItem(`clips_favs_${userId}`, JSON.stringify(favorites));
}

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

export function ClipsView() {
    const session = useRequiredSession();
    const { t, locale } = useTranslation();
    const clipsT = t.clips;
    const CLIPS_SORT_OPTIONS = useMemo(() => getClipsSortOptions(t), [t]);
    
    const { showToast } = useToast();
    const [clips, setClips] = useState<Clip[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('date-desc');
    const [page, setPage] = useState(1);
    const [showFavsOnly, setShowFavsOnly] = useState(false);
    const [playingClip, setPlayingClip] = useState<Clip | null>(null);
    const [embedSession, setEmbedSession] = useState(0);

    const openClipPlayer = (clip: Clip) => {
        setPlayingClip(clip);
        setEmbedSession((n) => n + 1);
    };

    const closeClipPlayer = () => {
        setPlayingClip(null);
    };

    useEffect(() => {
        if (session.userId) {
            setFavorites(loadFavorites(session.userId));
        }
    }, [session.userId]);

    const loadClips = useCallback(
        async (force = false) => {
            if (!session.login) return;
            const cacheKey = `clips_${session.userId ?? session.login}`;

            if (!force) {
                const cached = cache.get<Clip[]>(cacheKey);
                if (cached) {
                    setClips(cached);
                    setLoading(false);
                    return;
                }
            }

            setLoading(true);
            try {
                const params = new URLSearchParams({ channel: session.login });
                const data = await apiFetch<Clip[] | { clips?: Clip[]; data?: Clip[] }>(
                    `${API_ENDPOINTS.CLIPS}?${params}`,
                    session
                );
                const list = Array.isArray(data) ? data : data.clips ?? data.data ?? [];
                setClips(list);
                if (list.length > 0) cache.set(cacheKey, list, CACHE_TTL);
                if (force) showToast(clipsT.toasts.updated, 'success');
            } catch {
                showToast(clipsT.toasts.errorLoad, 'error');
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line
        [session, showToast]
    );

    useEffect(() => {
        void loadClips();
    }, [loadClips]);

    const toggleFavorite = (clipId: string) => {
        if (!session.userId) return;
        setFavorites((prev) => {
            const next = prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId];
            saveFavorites(session.userId!, next);
            return next;
        });
    };

    const copyUrl = async (url: string) => {
        const ok = await copyText(url);
        if (ok) showToast(clipsT.toasts.copied, 'success');
    };

    const filtered = useMemo(() => {
        let list = [...clips];
        if (showFavsOnly) {
            list = list.filter((c) => favorites.includes(c.id));
        }
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((c) => (c.title ?? '').toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            const aFav = favorites.includes(a.id) ? 1 : 0;
            const bFav = favorites.includes(b.id) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;

            switch (sort) {
                case 'date-asc':
                    return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
                case 'views-desc':
                    return (b.view_count ?? 0) - (a.view_count ?? 0);
                case 'views-asc':
                    return (a.view_count ?? 0) - (b.view_count ?? 0);
                case 'date-desc':
                default:
                    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
            }
        });
        return list;
    }, [clips, search, sort, favorites, showFavsOnly]);

    const visible = filtered.slice(0, page * ITEMS_PER_PAGE);
    const hasMore = visible.length < filtered.length;

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
                    <div className="flex shrink-0 items-center gap-2">
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
                            onClick={() => void loadClips(true)}
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
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder={clipsT.searchPlaceholder}
                                aria-label={clipsT.searchPlaceholder}
                                className={CLIPS_SEARCH}
                            />
                        </div>
                        <div className="shrink-0 max-[600px]:w-full">
                            <SelectField
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value);
                                    setPage(1);
                                }}
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

                                                <div className="absolute top-2 right-2 z-[2] flex gap-1 opacity-0 transition duration-200 group-hover/card:opacity-100">
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
                                                    className="mb-2 block truncate text-[0.8125rem] font-semibold text-text-main no-underline transition-colors hover:text-brand-text hover:underline"
                                                    title={clip.title ?? clipsT.untitled}
                                                >
                                                    {clip.title ?? clipsT.untitled}
                                                </a>
                                                <div className="flex justify-between gap-2 text-[0.6875rem] text-text-muted">
                                                    <span className="truncate">{viewsStr} {clipsT.views}</span>
                                                    <span className="shrink-0">{dateStr}</span>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            {hasMore && (
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => p + 1)}
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
                    clipId={playingClip.id}
                    title={playingClip.title}
                    embedSession={embedSession}
                    onClose={closeClipPlayer}
                />
            ) : null}
        </>
    );
}
