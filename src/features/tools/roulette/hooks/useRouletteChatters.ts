import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS, IGNORED_BOTS, type Session } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import {
    matchesChatKeyword,
    normalizeChatKeyword
} from '@/features/tools/lib/normalizeChatKeyword';
import type { RouletteUser } from '@/core/types/twitch';
import { TabSyncService } from '@/features/dashboard/lib/tabSyncService';
import {
    DEFAULT_ELIGIBILITY_FILTERS,
    filtersToApiParam,
    isAllFilters,
    rolesFromTags,
    tagsMatchFilters,
    userMatchesFilters,
    type EligibilityFilters
} from '@/features/tools/lib/eligibility';
import { useTranslation } from '@/core/i18n/I18nContext';
import {
    readEntryModePref,
    readKeywordPref,
    writeEntryModePref,
    writeKeywordPref,
    type RouletteEntryMode
} from '@/features/tools/roulette/lib/roulettePrefs';

const LISTENER_ID = 'roulette';
const CHATTERS_CLIENT_TTL_MS = 40_000;

export interface UseRouletteChattersOptions {
    session: Session;
    active?: boolean;
    isOpen: boolean;
    isSpinning: boolean;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    onChatError?: () => void;
}

export function useRouletteChatters({
    session,
    active = true,
    isOpen,
    isSpinning,
    showToast,
    onChatError
}: UseRouletteChattersOptions) {
    const [chatters, setChatters] = useState<RouletteUser[]>([]);
    const [filters, setFilters] = useState<EligibilityFilters>(DEFAULT_ELIGIBILITY_FILTERS);
    const [countPulse, setCountPulse] = useState(false);
    const pulseTimerRef = useRef<number | null>(null);
    const [entryMode, setEntryModeState] = useState<RouletteEntryMode>(() =>
        readEntryModePref(session.userId)
    );
    const [keywordInput, setKeywordInputState] = useState(() => readKeywordPref(session.userId));
    const entryModeRef = useRef(entryMode);
    entryModeRef.current = entryMode;
    const keywordRef = useRef(normalizeChatKeyword(keywordInput, '!sorteo'));
    keywordRef.current = normalizeChatKeyword(keywordInput, '!sorteo');
    const syncRef = useRef<TabSyncService | null>(null);
    const chattersRef = useRef(chatters);
    chattersRef.current = chatters;
    const lastFetchAtRef = useRef(0);
    const inFlightRef = useRef<Promise<void> | null>(null);
    const onChatErrorRef = useRef(onChatError);
    onChatErrorRef.current = onChatError;

    const { t } = useTranslation();
    const gT = t.globals.toasts;
    const gTRef = useRef(gT);
    gTRef.current = gT;

    const isOpenRef = useRef(isOpen);
    const isSpinningRef = useRef(isSpinning);
    const filtersRef = useRef(filters);
    isOpenRef.current = isOpen;
    isSpinningRef.current = isSpinning;
    filtersRef.current = filters;

    const pulseCounter = useCallback(() => {
        setCountPulse(true);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = window.setTimeout(() => setCountPulse(false), 500);
    }, []);

    const loadChatters = useCallback(
        async (opts?: { force?: boolean }) => {
            if (!session.login) return;

            const now = Date.now();
            if (
                !opts?.force &&
                lastFetchAtRef.current > 0 &&
                now - lastFetchAtRef.current < CHATTERS_CLIENT_TTL_MS
            ) {
                return;
            }
            if (inFlightRef.current) return inFlightRef.current;

            const run = (async () => {
                if (isAllFilters(filtersRef.current)) {
                    setChatters((prev) => {
                        const existing = new Set(prev.map((u) => u.user_login.toLowerCase()));
                        if (existing.has(session.login!.toLowerCase())) return prev;
                        pulseCounter();
                        return [
                            ...prev,
                            {
                                user_login: session.login!,
                                user_name: session.displayName || session.login!
                            }
                        ];
                    });
                }

                try {
                    const needsRoles = !isAllFilters(filtersRef.current);
                    const params = new URLSearchParams({
                        channel: session.login!,
                        eligibility: filtersToApiParam(filtersRef.current),
                        source: 'roulette',
                        annotate: needsRoles ? '1' : '0'
                    });
                    const res = await fetch(
                        `${API_ENDPOINTS.CHATTERS}?${params}`,
                        withApiCredentials({
                            headers: authHeaders(session)
                        })
                    );
                    if (!res.ok) {
                        if (!syncRef.current?.getIsLeader()) {
                            showToast(gTRef.current.rouletteLoadError, 'error');
                        }
                        return;
                    }
                    const data = await res.json();
                    const list: (string | RouletteUser)[] = Array.isArray(data)
                        ? data
                        : data.chatters ?? [];

                    setChatters((prev) => {
                        const existing = new Set(prev.map((u) => u.user_login.toLowerCase()));
                        const next = [...prev];
                        let added = 0;
                        list.forEach((item) => {
                            const login = typeof item === 'string' ? item : item.user_login;
                            const name = typeof item === 'string' ? item : item.user_name;
                            const mod = typeof item === 'string' ? undefined : item.mod;
                            const sub = typeof item === 'string' ? undefined : item.sub;
                            const vip = typeof item === 'string' ? undefined : item.vip;
                            if (!login) return;
                            const lower = login.toLowerCase();
                            if (!existing.has(lower) && !IGNORED_BOTS.has(lower)) {
                                next.push({
                                    user_login: login,
                                    user_name: name || login,
                                    mod,
                                    sub,
                                    vip
                                });
                                existing.add(lower);
                                added++;
                            } else if (existing.has(lower) && needsRoles) {
                                const idx = next.findIndex(
                                    (u) => u.user_login.toLowerCase() === lower
                                );
                                if (idx >= 0) {
                                    next[idx] = {
                                        ...next[idx],
                                        mod: mod ?? next[idx].mod,
                                        sub: sub ?? next[idx].sub,
                                        vip: vip ?? next[idx].vip
                                    };
                                }
                            }
                        });
                        if (added > 0) pulseCounter();
                        return next.filter((u) => userMatchesFilters(u, filtersRef.current));
                    });
                    lastFetchAtRef.current = Date.now();
                } catch {
                    showToast(gTRef.current.rouletteLoadError, 'error');
                } finally {
                    inFlightRef.current = null;
                }
            })();

            inFlightRef.current = run;
            return run;
        },
        [session, showToast, pulseCounter]
    );

    const handleTmiMessage = useCallback(
        (_ch: string, tags: Parameters<typeof tagsMatchFilters>[0], message: string) => {
            if (isSpinningRef.current || !isOpenRef.current) return;
            if (!tagsMatchFilters(tags, filtersRef.current)) return;
            const login = tags.username;
            if (!login || IGNORED_BOTS.has(login.toLowerCase())) return;

            if (entryModeRef.current === 'keyword') {
                const kw = keywordRef.current;
                if (!matchesChatKeyword(message, kw)) return;
            }

            const roles = rolesFromTags(tags);
            setChatters((prev) => {
                if (prev.some((u) => u.user_login.toLowerCase() === login.toLowerCase())) {
                    return prev;
                }
                pulseCounter();
                return [
                    ...prev,
                    {
                        user_login: login,
                        user_name: tags['display-name'] || login,
                        ...roles
                    }
                ];
            });
        },
        [pulseCounter]
    );

    useTmiChat(LISTENER_ID, {
        channel: session.login,
        session,
        enabled: active && isOpen,
        onMessage: handleTmiMessage,
        onError: () => {
            showToast(gTRef.current.rouletteChatError, 'error');
            onChatErrorRef.current?.();
        }
    });

    const setEntryMode = useCallback(
        (mode: RouletteEntryMode) => {
            if (isOpenRef.current || isSpinningRef.current) return;
            setEntryModeState(mode);
            writeEntryModePref(session.userId, mode);
        },
        [session.userId]
    );

    const setKeywordInput = useCallback(
        (value: string) => {
            if (isOpenRef.current || isSpinningRef.current) return;
            const cleaned = value.replace(/^!+/, '');
            setKeywordInputState(cleaned);
            writeKeywordPref(session.userId, cleaned);
        },
        [session.userId]
    );

    const resetChattersForOpen = useCallback(() => {
        setChatters([]);
        lastFetchAtRef.current = 0;
    }, []);

    useEffect(() => {
        if (!session.userId) return;
        setEntryModeState(readEntryModePref(session.userId));
        setKeywordInputState(readKeywordPref(session.userId));
    }, [session.userId]);

    useEffect(() => {
        setChatters((prev) => prev.filter((u) => userMatchesFilters(u, filters)));
        if (!isOpen || entryModeRef.current !== 'presence') return;
        void loadChatters({ force: !isAllFilters(filters) });
    }, [filters, isOpen, loadChatters]);

    useEffect(() => {
        return () => {
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        };
    }, []);

    return {
        chatters,
        setChatters,
        chattersRef,
        filters,
        setFilters,
        countPulse,
        entryMode,
        setEntryMode,
        keywordInput,
        setKeywordInput,
        keyword: keywordRef.current,
        loadChatters,
        resetChattersForOpen
    };
}
