import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Users, Radio, Snowflake, Search, RotateCw, User, Eye } from 'lucide-react';
import { API_ENDPOINTS, IGNORED_BOTS } from '@/core/config/config';
import { authHeaders, apiFetch, withApiCredentials } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import { cache, CACHE_TTL } from '@/core/cache/cacheService';
import { chatLogStore } from '@/features/chat/lib/chatLogStore';
import type { StalkerUser, TwitchUser } from '@/core/types/twitch';
import { fadeIn, hoverNeutralBorderedRow, hoverNeutralIconBtn, hoverSubtleRowBg, panelCard, textInput } from '@/core/utils/tw';
import { useToast } from '@/shared/ui/ToastProvider';
import { UserInspectModal } from '@/shared/ui/UserInspectModal';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { StalkerRowSkeleton } from '@/shared/ui/Skeleton';
import { EmptyStateIcon, IconSm, InlineIcon } from '@/shared/ui/Icon';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { useTranslation } from '@/core/i18n/I18nContext';

const LISTENER_ID = 'stalker';

export function StalkerView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const stalker = t.stalker;
    const { showToast } = useToast();
    const [scanning, setScanning] = useState(false);
    const [chatters, setChatters] = useState<StalkerUser[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [inspectUser, setInspectUser] = useState<TwitchUser | null>(null);
    const [highlightLogin, setHighlightLogin] = useState<string | null>(null);
    const scanningRef = useRef(scanning);
    scanningRef.current = scanning;
    const chattersRef = useRef(chatters);
    chattersRef.current = chatters;
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 300);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [search]);

    const loadChatters = useCallback(async () => {
        if (!scanningRef.current || !session.login) return;
        setLoading(true);
        try {
            const data = await apiFetch<StalkerUser[] | { chatters?: (string | StalkerUser)[] }>(
                `${API_ENDPOINTS.CHATTERS}?channel=${session.login}`,
                session
            );
            const list = Array.isArray(data) ? data : data.chatters ?? [];

            setChatters((prev) => {
                const map = new Map<string, StalkerUser>();
                prev.forEach((c) => map.set(c.user_login.toLowerCase(), c));
                list.forEach((item) => {
                    const login = typeof item === 'string' ? item : item.user_login;
                    const name = typeof item === 'string' ? item : item.user_name;
                    if (login && !IGNORED_BOTS.has(login.toLowerCase())) {
                        map.set(login.toLowerCase(), {
                            user_login: login,
                            user_name: name || login,
                            profile_image_url: typeof item === 'object' ? item.profile_image_url : null
                        });
                    }
                });
                return Array.from(map.values());
            });
        } catch {
            showToast(stalker.toasts.errorLoad, 'error');
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line
    }, [session, showToast]);

    const handleChatMessage = useCallback(
        (_ch: string, tags: { username?: string; 'display-name'?: string }, message: string) => {
            if (!scanningRef.current) return;
            const login = tags.username;
            if (!login || IGNORED_BOTS.has(login.toLowerCase())) return;
            chatLogStore.add(login, message);

            const lower = login.toLowerCase();
            if (chattersRef.current.some((u) => u.user_login.toLowerCase() === lower)) {
                return;
            }

            setHighlightLogin(lower);
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => setHighlightLogin(null), 1000);

            setChatters((prev) => {
                if (prev.some((u) => u.user_login.toLowerCase() === lower)) {
                    return prev;
                }
                return [
                    {
                        user_login: login,
                        user_name: tags['display-name'] || login,
                        profile_image_url: null
                    },
                    ...prev
                ];
            });
        },
        []
    );

    useTmiChat(LISTENER_ID, {
        channel: session.login,
        session,
        enabled: scanning && active,
        onMessage: handleChatMessage,
        onError: () => {
            showToast(stalker.toasts.errorChat, 'error');
            setScanning(false);
        }
    });

    const toggleScan = async () => {
        if (scanning) {
            setScanning(false);
            showToast(stalker.toasts.paused, 'info');
            return;
        }

        setScanning(true);
        showToast(stalker.toasts.started, 'success');
        void fetch(`${API_ENDPOINTS.BASE}/dashboard/track-usage`, withApiCredentials({
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
            body: JSON.stringify({ tool: 'stalker' })
        })).catch(() => {});
        await loadChatters();
    };

    const inspect = async (login: string) => {
        try {
            const cacheKey = `user_info_${login}`;
            const cached = cache.get<TwitchUser>(cacheKey);
            if (cached) {
                setInspectUser(cached);
                return;
            }
            const info = await apiFetch<TwitchUser>(`${API_ENDPOINTS.USER_INFO}?login=${login}`, session);
            cache.set(cacheKey, info, CACHE_TTL);
            setInspectUser(info);
        } catch {
            showToast(stalker.toasts.errorInfo, 'error');
        }
    };

    useEffect(() => {
        if (active && scanningRef.current) {
            void loadChatters();
        }
    }, [active, loadChatters]);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const filtered = chatters.filter((u) => {
        const q = debouncedSearch.toLowerCase();
        if (!q) return true;
        return u.user_name.toLowerCase().includes(q) || u.user_login.toLowerCase().includes(q);
    });

    const showEmpty = !scanning && filtered.length === 0 && !loading;
    const showWaiting = scanning && filtered.length === 0 && !loading;

    return (
        <>
            <div className={`${panelCard} ${fadeIn} mb-3 flex flex-col`}>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5 max-md:flex-col max-md:items-start">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                        >
                            <Users className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">
                                {stalker.title}
                            </h2>
                            <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">
                                {stalker.info}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:justify-between">
                        <span
                            className={`inline-flex items-center gap-1.5 text-[0.8125rem] ${scanning ? 'text-success' : 'text-text-muted'}`}
                        >
                            {scanning ? (
                                <>
                                    <InlineIcon icon={Radio} className="animate-pulse" />
                                    {stalker.toasts.started}
                                </>
                            ) : (
                                <>
                                    <InlineIcon icon={Snowflake} className="text-[#00f2ea]" />
                                    {stalker.toasts.paused}
                                </>
                            )}
                        </span>

                        <div className="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:flex-col max-md:items-stretch">
                            <div className="relative w-[200px] max-md:w-full">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={stalker.searchPlaceholder}
                                    aria-label={stalker.searchPlaceholder}
                                    className={`${textInput} pl-9`}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => void toggleScan()}
                                title={scanning ? stalker.btnPause : stalker.btnStart}
                                aria-label={scanning ? stalker.btnPause : stalker.btnStart}
                                className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] transition ${
                                    scanning ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'
                                }`}
                            >
                                {scanning ? <Pause className="size-4 shrink-0" /> : <Play className="size-4 shrink-0" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (scanning) {
                                        void loadChatters();
                                        showToast(stalker.toasts.reloaded, 'success');
                                    }
                                }}
                                title={stalker.btnReload}
                                aria-label={stalker.btnReload}
                                className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] text-text-muted ${hoverNeutralIconBtn}`}
                            >
                                <RotateCw className="size-4 shrink-0" />
                            </button>
                        </div>

                        <InfoTooltip text={stalker.tooltip} />
                    </div>
                </header>

                <div className="p-5">
                <div className="overflow-hidden rounded-xl border border-border-strong bg-bg-secondary">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border-strong bg-bg-secondary">
                                    <th className="w-[60px] px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-text-muted uppercase">
                                        {stalker.table.avatar}
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-text-muted uppercase">
                                        {stalker.table.user}
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-text-muted uppercase">
                                        {stalker.table.login}
                                    </th>
                                    <th className="px-5 py-3.5 text-right text-[0.6875rem] font-bold tracking-wide text-text-muted uppercase">
                                        {stalker.table.action}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => <StalkerRowSkeleton key={i} />)
                                ) : showEmpty ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center">
                                            <EmptyStateIcon icon={Radio} />
                                            <h2 className="mb-2 text-[0.95rem] font-bold text-text-main">
                                                {stalker.table.readyTitle}
                                            </h2>
                                            <p className="mx-auto max-w-[400px] text-[0.8125rem] text-text-muted">
                                                {stalker.table.readyDesc}
                                            </p>
                                        </td>
                                    </tr>
                                ) : showWaiting ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-10 text-center text-[0.8125rem] text-text-muted"
                                        >
                                            <span className="inline-flex items-center justify-center gap-2">
                                                <InlineIcon icon={Radio} className="animate-pulse" />
                                                {stalker.table.waiting}
                                            </span>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((user) => (
                                        <tr
                                            key={user.user_login}
                                            className={`stalker-row cursor-pointer ${hoverSubtleRowBg} ${
                                                highlightLogin === user.user_login.toLowerCase()
                                                    ? 'animate-[highlightFade_1s_forwards]'
                                                    : ''
                                            }`}
                                            onClick={() => void inspect(user.user_login)}
                                        >
                                            <td className="border-b border-border-subtle px-5 py-3 align-middle">
                                                {user.profile_image_url ? (
                                                    <img
                                                        src={user.profile_image_url}
                                                        alt={user.user_name}
                                                        loading="lazy"
                                                        className="block h-8 w-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg-secondary text-text-muted">
                                                        <IconSm icon={User} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border-b border-border-subtle px-5 py-3 align-middle text-[0.8125rem] font-semibold tracking-[0.5px]">
                                                {user.user_name}
                                            </td>
                                            <td className="border-b border-border-subtle px-5 py-3 align-middle font-[Consolas,monospace] text-[0.8125rem] text-text-muted">
                                                @{user.user_login}
                                            </td>
                                            <td className="border-b border-border-subtle px-5 py-3 text-right align-middle">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void inspect(user.user_login);
                                                    }}
                                                    className={`inline-flex items-center gap-1 rounded-md border border-border-strong bg-transparent px-3 py-1.5 text-[0.8125rem] text-text-muted ${hoverNeutralBorderedRow}`}
                                                >
                                                    <Eye className="size-4 shrink-0" />
                                                    {stalker.table.btnView}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="mt-2.5 text-center text-[0.6875rem] text-text-muted">
                    {stalker.footer}
                </p>
                </div>
            </div>

            <UserInspectModal user={inspectUser} onClose={() => setInspectUser(null)} />
        </>
    );
}
