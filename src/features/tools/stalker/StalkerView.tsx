import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Users, Radio, Snowflake, Search, RotateCw, User, Eye } from 'lucide-react';
import { API_ENDPOINTS, IGNORED_BOTS } from '@/core/config/config';
import { authHeaders, apiFetch } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import { cache, CACHE_TTL } from '@/core/cache/cacheService';
import { chatLogStore } from '@/features/chat/lib/chatLogStore';
import type { StalkerUser, TwitchUser } from '@/core/types/twitch';
import { card, fadeIn } from '@/core/ui/tw';
import { useToast } from '@/shared/ui/ToastProvider';
import { UserInspectModal } from '@/shared/ui/UserInspectModal';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { StalkerRowSkeleton } from '@/shared/ui/Skeleton';
import { CardHeaderIcon, EmptyStateIcon, IconSm, InlineIcon } from '@/shared/ui/Icon';

const LISTENER_ID = 'stalker';

export function StalkerView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
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
            showToast('Error al cargar chatters', 'error');
        } finally {
            setLoading(false);
        }
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
            showToast('Error al conectar con el chat', 'error');
            setScanning(false);
        }
    });

    const toggleScan = async () => {
        if (scanning) {
            setScanning(false);
            showToast('Vista Congelada (Pausado)', 'info');
            return;
        }

        setScanning(true);
        showToast('Escaneo iniciado', 'success');
        void fetch(`${API_ENDPOINTS.BASE}/dashboard/track-usage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
            body: JSON.stringify({ tool: 'stalker' })
        }).catch(() => {});
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
            showToast('No se pudo cargar info del usuario', 'error');
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
            <div className={`${card} ${fadeIn} mb-3`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-2 max-md:flex-col max-md:items-start">
                    <div className="flex items-center gap-3">
                        <CardHeaderIcon icon={Users} />
                        <div>
                            <h3 className="mb-0.5 text-[0.95rem] font-bold">Visor de Chat (Stalker)</h3>
                            <p className="text-[0.8rem] text-[#c4c4cc]">Quién está en tu chat ahora mismo</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:justify-between">
                        <span
                            className={`inline-flex items-center gap-1.5 text-[0.8125rem] ${scanning ? 'text-success' : 'text-[#c4c4cc]'}`}
                        >
                            {scanning ? (
                                <>
                                    <InlineIcon icon={Radio} className="animate-pulse" />
                                    Escaneo iniciado
                                </>
                            ) : (
                                <>
                                    <InlineIcon icon={Snowflake} className="text-[#00f2ea]" />
                                    Vista Congelada (Pausado)
                                </>
                            )}
                        </span>

                        <div className="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:flex-col max-md:items-stretch">
                            <div className="relative w-[200px] max-md:w-full">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#c4c4cc]" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar usuario..."
                                    aria-label="Buscar usuario..."
                                    className="w-full rounded-md border border-white/[0.08] bg-bg-secondary py-2 pr-3 pl-9 text-[0.8125rem] text-[#fafafa] outline-none transition focus:border-primary"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => void toggleScan()}
                                title={scanning ? 'Pausar Escaneo' : 'Iniciar Escaneo'}
                                aria-label={scanning ? 'Pausar Escaneo' : 'Iniciar Escaneo'}
                                className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] transition hover:bg-white/5 ${
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
                                        showToast('Lista Stalker recargada', 'success');
                                    }
                                }}
                                title="Recargar lista"
                                aria-label="Recargar lista"
                                className="rounded-lg border-none px-3 py-1 text-[0.8125rem] text-[#c4c4cc] transition hover:bg-white/5 hover:text-[#fafafa]"
                            >
                                <RotateCw className="size-4 shrink-0" />
                            </button>
                        </div>

                        <InfoTooltip text="Lista de usuarios conectados, clasificados por rol (Mods, VIPs, etc). Clic para detalles." />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.08] bg-black/20">
                                    <th className="w-[60px] px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-[#c4c4cc] uppercase">
                                        Avatar
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-[#c4c4cc] uppercase">
                                        Usuario
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-[#c4c4cc] uppercase">
                                        Login
                                    </th>
                                    <th className="px-5 py-3.5 text-right text-[0.6875rem] font-bold tracking-wide text-[#c4c4cc] uppercase">
                                        Acción
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
                                            <h3 className="mb-2 text-[0.95rem] font-bold text-[#fafafa]">
                                                Esperando señal...
                                            </h3>
                                            <p className="mx-auto max-w-[400px] text-[0.8125rem] text-[#c4c4cc]">
                                                Dale al botón <strong className="text-[#fafafa]">Play</strong> para
                                                comenzar a escanear el chat.
                                            </p>
                                        </td>
                                    </tr>
                                ) : showWaiting ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-10 text-center text-[0.8125rem] text-[#71717a]"
                                        >
                                            <span className="inline-flex items-center justify-center gap-2">
                                                <InlineIcon icon={Radio} className="animate-pulse" />
                                                Esperando usuarios en el chat...
                                            </span>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((user) => (
                                        <tr
                                            key={user.user_login}
                                            className={`stalker-row cursor-pointer transition hover:bg-white/[0.05] ${
                                                highlightLogin === user.user_login.toLowerCase()
                                                    ? 'animate-[highlightFade_1s_forwards]'
                                                    : ''
                                            }`}
                                            onClick={() => void inspect(user.user_login)}
                                        >
                                            <td className="border-b border-white/[0.03] px-5 py-3 align-middle">
                                                {user.profile_image_url ? (
                                                    <img
                                                        src={user.profile_image_url}
                                                        alt={user.user_name}
                                                        loading="lazy"
                                                        className="block h-8 w-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg-secondary text-[#71717a]">
                                                        <IconSm icon={User} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border-b border-white/[0.03] px-5 py-3 align-middle text-[0.8125rem] font-semibold tracking-[0.5px]">
                                                {user.user_name}
                                            </td>
                                            <td className="border-b border-white/[0.03] px-5 py-3 align-middle font-[Consolas,monospace] text-[0.8125rem] text-[#c4c4cc]">
                                                @{user.user_login}
                                            </td>
                                            <td className="border-b border-white/[0.03] px-5 py-3 text-right align-middle">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void inspect(user.user_login);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-transparent px-3 py-1.5 text-[0.8125rem] text-[#c4c4cc] transition hover:border-primary hover:bg-primary hover:text-[#fafafa]"
                                                >
                                                    <Eye className="size-4 shrink-0" />
                                                    Ver
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="mt-2.5 text-center text-[0.6875rem] text-[#71717a]">
                    * La detección de usuarios se basa en la actividad reciente del chat.
                </p>
            </div>

            <UserInspectModal user={inspectUser} onClose={() => setInspectUser(null)} />
        </>
    );
}
