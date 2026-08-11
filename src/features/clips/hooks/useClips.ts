import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { cache, CACHE_TTL } from '@/core/cache/cacheService';
import { useTranslation } from '@/core/i18n/I18nContext';
import { copyText } from '@/core/utils/clipboard';

export interface Clip {
    id: string;
    url: string;
    title?: string;
    thumbnail_url?: string;
    created_at?: string;
    view_count?: number;
}

export const ITEMS_PER_PAGE = 20;

// eslint-disable-next-line
const getClipsSortOptions = (t: any) => [
    { value: 'date-desc', label: t.clips.sort.dateDesc },
    { value: 'date-asc', label: t.clips.sort.dateAsc },
    { value: 'views-desc', label: t.clips.sort.viewsDesc },
    { value: 'views-asc', label: t.clips.sort.viewsAsc }
];

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

export function useClips({ active = true }: { active?: boolean } = {}) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const clipsT = t.clips;
    const CLIPS_SORT_OPTIONS = useMemo(() => getClipsSortOptions(t), [t]);

    const { showToast } = useToast();
    const [clips, setClips] = useState<Clip[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('date-desc');
    const [page, setPage] = useState(1);
    const [showFavsOnly, setShowFavsOnly] = useState(false);
    const [serverHasMore, setServerHasMore] = useState(false);
    const loadRef = useRef<{ generation: number; controller: AbortController | null }>({
        generation: 0,
        controller: null
    });

    useEffect(() => {
        if (session.userId) {
            setFavorites(loadFavorites(session.userId));
        }
    }, [session.userId]);

    const loadClips = useCallback(
        async (force = false, requestedLimit = ITEMS_PER_PAGE) => {
            if (!session.login) return false;
            const cacheKey = `clips_${session.userId ?? session.login}`;

            if (!force && requestedLimit === ITEMS_PER_PAGE) {
                const cached = cache.get<Clip[]>(cacheKey);
                if (cached) {
                    setClips(cached);
                    setServerHasMore(cached.length === ITEMS_PER_PAGE);
                    setLoading(false);
                    return true;
                }
            }

            loadRef.current.controller?.abort();
            const controller = new AbortController();
            const generation = loadRef.current.generation + 1;
            loadRef.current = { generation, controller };
            const isLoadingMore = requestedLimit > ITEMS_PER_PAGE;
            if (isLoadingMore) setLoadingMore(true);
            else setLoading(true);
            try {
                const params = new URLSearchParams({
                    channel: session.login,
                    limit: String(requestedLimit)
                });
                const data = await apiFetch<Clip[] | { clips?: Clip[]; data?: Clip[] }>(
                    `${API_ENDPOINTS.CLIPS}?${params}`,
                    session,
                    { signal: controller.signal }
                );
                const list = Array.isArray(data) ? data : data.clips ?? data.data ?? [];
                if (controller.signal.aborted || loadRef.current.generation !== generation) {
                    return false;
                }
                setClips(list);
                setServerHasMore(list.length === requestedLimit && requestedLimit < 100);
                // No cachear vacío: un primer load sin clips ocultaría clips nuevos hasta el TTL.
                if (list.length > 0 && requestedLimit === ITEMS_PER_PAGE) {
                    cache.set(cacheKey, list, CACHE_TTL);
                } else {
                    cache.clear(cacheKey);
                }
                if (force) showToast(clipsT.toasts.updated, 'success');
                return true;
            } catch (error) {
                if (controller.signal.aborted || (error as Error).name === 'AbortError') return false;
                showToast(clipsT.toasts.errorLoad, 'error');
                return false;
            } finally {
                if (loadRef.current.generation === generation) {
                    loadRef.current.controller = null;
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        // eslint-disable-next-line
        [session, showToast]
    );

    useEffect(() => {
        if (!active) return;
        void loadClips();
        return () => {
            loadRef.current.controller?.abort();
            loadRef.current.generation++;
        };
    }, [active, loadClips]);

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
    const hasMore = visible.length < filtered.length || serverHasMore;

    const loadMore = () => {
        if (visible.length < filtered.length) {
            setPage((p) => p + 1);
            return;
        }
        const nextPage = page + 1;
        void loadClips(false, Math.min(nextPage * ITEMS_PER_PAGE, 100)).then((loaded) => {
            if (loaded) setPage(nextPage);
        });
    };

    const reload = () => {
        setPage(1);
        void loadClips(true);
    };

    const onSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const onSortChange = (value: string) => {
        setSort(value);
        setPage(1);
    };

    return {
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
        copyUrl
    };
}
