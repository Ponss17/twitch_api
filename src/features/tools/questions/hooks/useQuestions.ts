import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';
import { IGNORED_BOTS } from '@/core/config/config';
import {
    matchesChatKeyword,
    normalizeChatKeyword
} from '@/features/tools/lib/normalizeChatKeyword';
import {
    DEFAULT_ELIGIBILITY_FILTERS,
    hasAnyFilter,
    tagsMatchFilters,
    type EligibilityFilters
} from '@/features/tools/lib/eligibility';
import {
    fetchQuestions,
    persistClearQuestions,
    persistQuestion,
    persistQuestionStatus,
    persistRemoveQuestion
} from '@/features/tools/questions/lib/questionsApi';
import {
    MAX_QUESTION_ITEMS,
    QUESTION_MAX_AGE_DAYS,
    type QuestionItem,
    type QuestionStatus
} from '@/features/tools/questions/lib/questionTypes';

export type { QuestionItem, QuestionStatus };
export { MAX_QUESTION_ITEMS, QUESTION_MAX_AGE_DAYS };

function stripKeyword(message: string, keyword: string): string {
    const trimmed = message.trim();
    if (matchesChatKeyword(trimmed, keyword)) {
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
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [filters, setFilters] = useState<EligibilityFilters>(DEFAULT_ELIGIBILITY_FILTERS);

    const keyword = useMemo(() => normalizeChatKeyword(keywordInput), [keywordInput]);
    const keywordRef = useRef(keyword);
    keywordRef.current = keyword;
    const filtersRef = useRef(filters);
    filtersRef.current = filters;
    const sessionRef = useRef(session);
    sessionRef.current = session;

    useEffect(() => {
        let cancelled = false;
        setLoadingHistory(true);
        void fetchQuestions(session)
            .then((list) => {
                if (!cancelled) setItems(list);
            })
            .catch(() => {
                if (!cancelled) showToast(qT.loadError, 'warning');
            })
            .finally(() => {
                if (!cancelled) setLoadingHistory(false);
            });
        return () => {
            cancelled = true;
        };
    }, [session.userId, session, showToast, qT.loadError]);

    useTmiChat('questions-listener', {
        channel: session.login,
        session,
        enabled: isActive && tabActive,
        onMessage: (_channel, tags, message) => {
            const kw = keywordRef.current;
            const trimmed = message.trim();
            if (!matchesChatKeyword(trimmed, kw)) return;
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

            setItems((prev) => [item, ...prev].slice(0, MAX_QUESTION_ITEMS));
            void persistQuestion(sessionRef.current, item)
                .then((list) => setItems(list))
                .catch(() => {
                    /* UI ya tiene el ítem local; el prune/sync fallará en el próximo load */
                });
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
        void persistQuestionStatus(sessionRef.current, id, 'answered')
            .then((list) => setItems(list))
            .catch(() => undefined);
    }, []);

    const markSkipped = useCallback((id: string) => {
        setItems((prev) => {
            const target = prev.find((q) => q.id === id);
            if (!target) return prev;
            const rest = prev.filter((q) => q.id !== id);
            return [...rest, { ...target, status: 'skipped' as const }];
        });
        void persistQuestionStatus(sessionRef.current, id, 'skipped')
            .then((list) => setItems(list))
            .catch(() => undefined);
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((q) => q.id !== id));
        void persistRemoveQuestion(sessionRef.current, id)
            .then((list) => setItems(list))
            .catch(() => undefined);
    }, []);

    const clearAll = useCallback(() => {
        setIsActive(false);
        setItems([]);
        void persistClearQuestions(sessionRef.current, false)
            .then((list) => setItems(list))
            .catch(() => undefined);
    }, []);

    const clearDone = useCallback(() => {
        setItems((prev) => prev.filter((q) => q.status === 'pending'));
        void persistClearQuestions(sessionRef.current, true)
            .then((list) => setItems(list))
            .catch(() => undefined);
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
        loadingHistory,
        maxItems: MAX_QUESTION_ITEMS,
        maxAgeDays: QUESTION_MAX_AGE_DAYS,
        toggleListening,
        markAnswered,
        markSkipped,
        removeItem,
        clearAll,
        clearDone
    };
}
