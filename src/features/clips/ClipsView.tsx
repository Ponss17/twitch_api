import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { ClipsGridSkeleton } from '@/shared/ui/Skeleton';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { cache, CACHE_TTL } from '@/core/cache/cacheService';
import { card, fadeIn } from '@/core/utils/tw';
import { ClipPlayerOverlay } from '@/features/clips/ClipPlayerOverlay';
import { SelectField } from '@/shared/ui/SelectField';
import { ClipCommandView } from '@/features/commands/CommandsViews';
import { Star, RotateCw, Link as LinkIcon, Images, Search, Play } from 'lucide-react';


interface Clip {
    id: string;
    url: string;
    title?: string;
    thumbnail_url?: string;
    created_at?: string;
    view_count?: number;
}

const ITEMS_PER_PAGE = 20;

const CLIPS_SORT_OPTIONS = [
    { value: 'date-desc', label: 'Más recientes' },
    { value: 'date-asc', label: 'Más antiguos' },
    { value: 'views-desc', label: 'Más vistos' },
    { value: 'views-asc', label: 'Menos vistos' }
] as const;

const CLIPS_GRID =
    'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5 max-[600px]:grid-cols-1';

const CLIP_CARD =
    'group/card relative overflow-hidden rounded-xl border border-white/[0.08] bg-bg-secondary transition-all duration-200 hover:border-primary/25';

const CLIP_OVERLAY_BTN =
    'flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white/70 backdrop-blur-[2px] transition hover:bg-black/55 hover:text-white';

const CLIP_TOOLBAR_BTN = (active = false) =>
    `flex h-8 w-8 items-center justify-center rounded-md border transition ${
        active
            ? 'border-primary/40 bg-primary/15 text-primary'
            : 'border-white/[0.08] bg-white/[0.02] text-[#c4c4cc] hover:border-primary/30 hover:bg-white/5 hover:text-[#fafafa]'
    }`;

const CLIPS_SEARCH =
    'w-full rounded-lg border border-white/[0.08] bg-bg-secondary py-[7px] pr-2.5 pl-9 text-[0.8125rem] leading-tight text-[#fafafa] outline-none transition focus:border-primary focus:bg-primary/[0.02]';

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

function formatClipDate(value?: string) {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function ClipsView() {
    const session = useRequiredSession();
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
                if (force) showToast('Clips actualizados', 'success');
            } catch {
                showToast('Error al cargar clips', 'error');
            } finally {
                setLoading(false);
            }
        },
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
        await navigator.clipboard.writeText(url);
        showToast('Enlace copiado', 'success');
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

            <div className={`${card} ${fadeIn} mb-3 [animation-delay:60ms]`}>
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                            <Images className="w-5 h-5 text-center" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="mb-0.5 text-[0.95rem] font-bold">Clips Recientes</h3>
                            <p className="text-[0.8rem] text-[#c4c4cc]">Los últimos clips de tu canal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFavsOnly((v) => !v)}
                            title="Solo favoritos"
                            aria-pressed={showFavsOnly}
                            className={CLIP_TOOLBAR_BTN(showFavsOnly)}
                        >
                            <Star className={`h-3.5 w-3.5 ${showFavsOnly ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={() => void loadClips(true)}
                            title="Recargar lista de clips"
                            className={CLIP_TOOLBAR_BTN()}
                        >
                            <RotateCw className="h-3.5 w-3.5" />
                        </button>
                        <InfoTooltip text="Galería de tus clips más recientes. Se actualiza automáticamente." />
                    </div>
                </div>

                <div className="text-[#fafafa]">
                    <div className="mb-5 flex flex-wrap gap-[15px] max-[600px]:flex-col">
                        <div className="relative min-w-[200px] flex-1">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[0.8125rem] text-[#71717a] w-3.5 h-3.5"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Buscar clips..."
                                aria-label="Buscar clips"
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
                                aria-label="Ordenar clips"
                                className="max-[600px]:w-full max-[600px]:max-w-none"
                                options={[...CLIPS_SORT_OPTIONS]}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <ClipsGridSkeleton count={6} className={CLIPS_GRID} />
                    ) : filtered.length === 0 ? (
                        <p className="py-8 text-center text-[0.8125rem] text-[#71717a]">
                            No hay clips disponibles.
                        </p>
                    ) : (
                        <>
                            <div className={CLIPS_GRID}>
                                {visible.map((clip, index) => {
                                    const isFav = favorites.includes(clip.id);
                                    const viewsStr =
                                        clip.view_count != null
                                            ? clip.view_count.toLocaleString('es-ES')
                                            : '0';
                                    const dateStr = formatClipDate(clip.created_at);
                                    const isAboveFold = index < 6;

                                    return (
                                        <article key={clip.id} className={CLIP_CARD}>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => openClipPlayer(clip)}
                                                    className="group/thumb relative block w-full cursor-pointer border-none bg-transparent p-0 text-left"
                                                    aria-label={`Reproducir clip ${clip.title ?? clip.id}`}
                                                >
                                                    {clip.thumbnail_url ? (
                                                        <>
                                                            <img
                                                                src={clip.thumbnail_url}
                                                                alt=""
                                                                loading={isAboveFold ? 'eager' : 'lazy'}
                                                                fetchPriority={index === 0 ? 'high' : undefined}
                                                                className="aspect-video w-full bg-bg-secondary object-cover transition duration-200 group-hover/card:brightness-[0.88]"
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
                                                        <div className="flex aspect-video w-full items-center justify-center bg-black/30 text-[0.75rem] font-medium text-[#71717a]">
                                                            Ver clip
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
                                                        title="Favorito"
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
                                                        title="Copiar enlace"
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
                                                    className="mb-2 block truncate text-[0.8125rem] font-semibold text-primary no-underline transition hover:underline"
                                                    title={clip.title ?? 'Sin título'}
                                                >
                                                    {clip.title ?? 'Sin título'}
                                                </a>
                                                <div className="flex justify-between gap-2 text-[0.6875rem] text-[#71717a]">
                                                    <span className="truncate">{viewsStr} visualizaciones</span>
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
                                    className="mt-6 w-full rounded-lg border border-white/[0.08] bg-bg-secondary py-2.5 text-[0.8125rem] font-semibold text-[#c4c4cc] transition hover:border-primary/30 hover:bg-white/5 hover:text-[#fafafa]"
                                >
                                    Cargar más
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
