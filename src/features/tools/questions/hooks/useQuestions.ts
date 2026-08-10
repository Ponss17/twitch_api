import { useState, useCallback, useRef, useMemo } from 'react';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';
import { IGNORED_BOTS } from '@/core/config/config';
import { normalizeChatKeyword } from '@/features/tools/lib/normalizeChatKeyword';
import {
    DEFAULT_ELIGIBILITY_FILTERS,
    hasAnyFilter,
    tagsMatchFilters,
    type RouletteEligibilityFilters
} from '@/features/tools/lib/eligibility';

export type QuestionStatus = 'pending' | 'answered' | 'skipped';

export interface QuestionItem {
    id: string;
    username: string;
    displayName: string;
    text: string;
    createdAt: number;
    status: QuestionStatus;
}

const MAX_ITEMS = 100;

function stripKeyword(message: string, keyword: string): string {
    const trimmed = message.trim();
    if (trimmed.toLowerCase().startsWith(keyword.toLowerCase())) {
        return trimmed.slice(keyword.length).trim();
    }
    return trimmed;
}

export function useQuestions({ tabActive = true }: { tabActive?: boolean } = {}) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const qT = t.tools.questions;
    const { showToast } = useToast();

    const [isActive, setIsActive] = useState(false);
    const [keywordInput, setKeywordInput] = useState('pregunta');
    const [items, setItems] = useState<QuestionItem[]>([]);
    const [filters, setFilters] = useState<RouletteEligibilityFilters>(DEFAULT_ELIGIBILITY_FILTERS);

    const keyword = useMemo(() => normalizeChatKeyword(keywordInput), [keywordInput]);
    const keywordRef = useRef(keyword);
    keywordRef.current = keyword;
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    useTmiChat('questions-listener', {
        channel: session.login,
        session,
        enabled: isActive && tabActive,
        onMessage: (_channel, tags, message) => {
            const kw = keywordRef.current;
            const trimmed = message.trim();
            if (!trimmed.toLowerCase().startsWith(kw.toLowerCase())) return;
            if (!tagsMatchFilters(tags, filtersRef.current)) return;

            const username = tags.username?.toLowerCase() || '';
            if (!username || IGNORED_BOTS.has(username)) return;

            const text = stripKeyword(trimmed, kw);
            if (!text) return;

            const item: QuestionItem = {
                id: `${username}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                username,
                displayName: tags['display-name'] || username,
                text,
                createdAt: Date.now(),
                status: 'pending'
            };

            setItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));
        }
    });

    const toggleListening = useCallback(() => {
        setIsActive((prev) => {
            if (!prev) {
                if (!hasAnyFilter(filtersRef.current)) {
                    showToast(qT.missingFilter, 'warning');
                    return prev;
                }
                showToast(qT.started, 'success');
                return true;
            }
            showToast(qT.stopped, 'info');
            return false;
        });
    }, [showToast, qT.started, qT.stopped, qT.missingFilter]);

    const setKeyword = useCallback((value: string) => {
        setKeywordInput(value.replace(/^!+/, ''));
    }, []);

    const markAnswered = useCallback((id: string) => {
        setItems((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'answered' as const } : q)));
    }, []);

    const markSkipped = useCallback((id: string) => {
        setItems((prev) => {
            const target = prev.find((q) => q.id === id);
            if (!target) return prev;
            const rest = prev.filter((q) => q.id !== id);
            return [...rest, { ...target, status: 'skipped' as const }];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((q) => q.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setIsActive(false);
        setItems([]);
    }, []);

    const clearDone = useCallback(() => {
        setItems((prev) => prev.filter((q) => q.status === 'pending'));
    }, []);

    const pending = useMemo(() => items.filter((q) => q.status === 'pending'), [items]);
    const current = pending[0] ?? null;

    return {
        isActive,
        keywordInput,
        keyword,
        setKeyword,
        filters,
        setFilters,
        items,
        pending,
        current,
        toggleListening,
        markAnswered,
        markSkipped,
        removeItem,
        clearAll,
        clearDone
    };
}
