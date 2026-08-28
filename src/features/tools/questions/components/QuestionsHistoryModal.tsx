import { useEffect, useMemo, useState } from 'react';
import { Check, History, MessageCircleQuestion, SkipForward, Trash2 } from 'lucide-react';
import { Modal } from '@/shared/ui/modals/Modal';
import { SimpleEmptyState } from '@/shared/ui/SimpleEmptyState';
import { useTranslation } from '@/core/i18n/I18nContext';
import { hoverSubtleIconBtn } from '@/core/utils/tw';
import type { QuestionItem } from '../hooks/useQuestions';

type HistoryFilter = 'all' | 'pending' | 'answered' | 'skipped';

interface QuestionsHistoryModalProps {
    open: boolean;
    onClose: () => void;
    items: QuestionItem[];
    onAnswer: (id: string) => void;
    onSkip: (id: string) => void;
    onRemove: (id: string) => void;
    maxItems: number;
    maxAgeDays: number;
}

function formatDateTime(ts: number): string {
    try {
        return new Date(ts).toLocaleString(undefined, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
}

export function QuestionsHistoryModal({
    open,
    onClose,
    items,
    onAnswer,
    onSkip,
    onRemove,
    maxItems,
    maxAgeDays
}: QuestionsHistoryModalProps) {
    const { t } = useTranslation();
    const qT = t.tools.questions;
    const [filter, setFilter] = useState<HistoryFilter>('all');

    useEffect(() => {
        if (!open) setFilter('all');
    }, [open]);

    const filtered = useMemo(() => {
        const list =
            filter === 'all' ? items : items.filter((q) => q.status === filter);
        return [...list].sort((a, b) => b.createdAt - a.createdAt);
    }, [items, filter]);

    const filters: { id: HistoryFilter; label: string }[] = [
        { id: 'all', label: qT.historyFilterAll },
        { id: 'pending', label: qT.historyFilterPending },
        { id: 'answered', label: qT.historyFilterAnswered },
        { id: 'skipped', label: qT.historyFilterSkipped }
    ];

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={qT.historyTitle}
            titleIcon={History}
        >
            <p className="mb-3 text-[0.8rem] text-text-muted">
                {qT.retentionHint
                    .replace('{max}', String(maxItems))
                    .replace('{days}', String(maxAgeDays))}
            </p>

            <div className="mb-3 flex flex-wrap gap-1.5">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        className={`rounded-lg px-2.5 py-1 text-[0.75rem] font-medium transition ${
                            filter === f.id
                                ? 'bg-primary/15 text-primary'
                                : `text-text-muted ${hoverSubtleIconBtn}`
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="max-h-[min(24rem,55vh)] overflow-y-auto overscroll-contain pr-0.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar]:w-1.5">
                {filtered.length === 0 ? (
                    <div className="py-10">
                        <SimpleEmptyState icon={MessageCircleQuestion} label={qT.historyEmpty} />
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {filtered.map((q) => (
                            <li
                                key={q.id}
                                className="rounded-xl border border-border-subtle bg-bg-overlay/50 px-3.5 py-3"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-text-main">
                                                {q.displayName}
                                            </span>
                                            <span className="text-[0.7rem] text-text-muted">
                                                {formatDateTime(q.createdAt)}
                                            </span>
                                            {q.status === 'pending' ? (
                                                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                                                    {qT.historyFilterPending}
                                                </span>
                                            ) : null}
                                            {q.status === 'answered' ? (
                                                <span className="rounded bg-success/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-success">
                                                    {qT.statusAnswered}
                                                </span>
                                            ) : null}
                                            {q.status === 'skipped' ? (
                                                <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-warning">
                                                    {qT.statusSkipped}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="whitespace-pre-wrap break-words text-[0.875rem] leading-snug text-text-main/90">
                                            {q.text}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {q.status === 'pending' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => onAnswer(q.id)}
                                                    title={qT.btnAnswer}
                                                    aria-label={qT.btnAnswer}
                                                    className={`rounded-lg border-none p-1.5 text-success ${hoverSubtleIconBtn}`}
                                                >
                                                    <Check className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onSkip(q.id)}
                                                    title={qT.btnSkip}
                                                    aria-label={qT.btnSkip}
                                                    className={`rounded-lg border-none p-1.5 text-warning ${hoverSubtleIconBtn}`}
                                                >
                                                    <SkipForward className="size-4" />
                                                </button>
                                            </>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => onRemove(q.id)}
                                            title={qT.btnRemove}
                                            aria-label={qT.btnRemove}
                                            className={`rounded-lg border-none p-1.5 text-text-muted ${hoverSubtleIconBtn}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
