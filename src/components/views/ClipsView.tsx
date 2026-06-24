import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';
import { apiFetch } from '@/lib/auth';
import { useRequiredSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/ToastProvider';
import { ClipsGridSkeleton } from '@/components/ui/Skeleton';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cache, CACHE_TTL } from '@/lib/cacheService';
import { card, fadeIn, selectInput } from '@/lib/tw';
import { ClipCommandView } from './CommandsViews';
import { Star, RotateCw, Link, Eye, Images, Search } from 'lucide-react';


interface Clip {
    id: string;
    url: string;
    title?: string;
    thumbnail_url?: string;
    created_at?: string;
    view_count?: number;
}

const ITEMS_PER_PAGE = 20;

const CLIPS_GRID =
    'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5 max-[600px]:grid-cols-1';

const CLIP_CARD =
    'group/card relative overflow-hidden rounded-xl border border-white/[0.08] bg-bg-secondary transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]';

const CLIP_ACTION_BTN =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-none bg-black/70 text-[#fafafa] backdrop-blur-[4px] transition hover:scale-110 hover:bg-primary';

const CLIPS_SEARCH =
    'w-full rounded-lg border border-white/[0.08] bg-bg-secondary py-[7px] pr-2.5 pl-9 text-[0.8125rem] leading-tight text-[#fafafa] outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(145,70,255,0.2)]';

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
                if (session.apiKey) params.set('apiKey', session.apiKey);
                else if (session.token) params.set('token', session.token);
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
                            <Images className="w-5 text-center" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="mb-0.5 text-[0.95rem] font-bold">Clips Recientes</h3>
                            <p className="text-[0.8rem] text-[#a1a1aa]">Los últimos clips de tu canal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFavsOnly((v) => !v)}
                            title="Solo favoritos"
                            className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] transition hover:bg-white/5 ${
                                showFavsOnly ? 'text-[#ffd700]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
                            }`}
                        >
                            <Star className={`${showFavsOnly ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={() => void loadClips(true)}
                            title="Recargar lista de clips"
                            className="rounded-lg border-none px-3 py-1 text-[0.8125rem] text-[#a1a1aa] transition hover:bg-white/5 hover:text-[#fafafa]"
                        >
                            <RotateCw />
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
                            <select
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value);
                                    setPage(1);
                                }}
                                className={`${selectInput} max-[600px]:w-full max-[600px]:max-w-none`}
                            >
                                <option value="date-desc">Más recientes</option>
                                <option value="date-asc">Más antiguos</option>
                                <option value="views-desc">Más vistos</option>
                                <option value="views-asc">Menos vistos</option>
                            </select>
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
                                        <div key={clip.id} className={CLIP_CARD}>
                                            <div className="absolute top-2.5 right-2.5 z-[2] flex gap-1 opacity-0 transition group-hover/card:opacity-100">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFavorite(clip.id)}
                                                    title="Favorito"
                                                    className={`${CLIP_ACTION_BTN} ${isFav ? 'text-[#ffd700] hover:bg-[rgba(255,215,0,0.2)]' : ''}`}
                                                >
                                                    <Star className={`${isFav ? 'fill-current' : ''} text-[0.75rem]`} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void copyUrl(clip.url)}
                                                    title="Copiar enlace"
                                                    className={CLIP_ACTION_BTN}
                                                >
                                                    <Link className="text-[0.75rem]" />
                                                </button>
                                            </div>
                                            <a
                                                href={clip.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-inherit no-underline"
                                            >
                                                {clip.thumbnail_url && (
                                                    <img
                                                        src={clip.thumbnail_url}
                                                        alt={clip.title ?? 'Clip'}
                                                        loading={isAboveFold ? 'eager' : 'lazy'}
                                                        fetchPriority={index === 0 ? 'high' : undefined}
                                                        className="aspect-video w-full bg-bg-secondary object-cover"
                                                    />
                                                )}
                                                <div className="p-3">
                                                    <div
                                                        className="mb-2 truncate text-[0.8125rem] font-semibold"
                                                        title={clip.title ?? 'Sin título'}
                                                    >
                                                        {clip.title ?? 'Sin título'}
                                                    </div>
                                                    <div className="flex justify-between text-[0.6875rem] text-[#a1a1aa]">
                                                        <span>
                                                            <Eye className="mr-1" />
                                                            {viewsStr}
                                                        </span>
                                                        <span>{dateStr}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                            {hasMore && (
                                <div className="mt-5 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => p + 1)}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-7 py-2 text-[0.8125rem] font-semibold text-[#fafafa] transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
                                    >
                                        Ver más clips
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
