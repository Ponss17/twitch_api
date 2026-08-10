import { Check, SkipForward, Trash2, MessageCircleQuestion } from 'lucide-react';
import type { QuestionItem } from '../hooks/useQuestions';
import { useTranslation } from '@/core/i18n/I18nContext';
import { hoverNeutralIconBtn } from '@/core/utils/tw';

interface QuestionsListProps {
    items: QuestionItem[];
    currentId: string | null;
    onAnswer: (id: string) => void;
    onSkip: (id: string) => void;
    onRemove: (id: string) => void;
}

function formatTime(ts: number): string {
    try {
        return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

export function QuestionsList({ items, currentId, onAnswer, onSkip, onRemove }: QuestionsListProps) {
    const { t } = useTranslation();
    const qT = t.tools.questions;

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle bg-bg-overlay/30 py-20 text-text-muted">
                <MessageCircleQuestion className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-sm font-medium">{qT.emptyList}</p>
            </div>
        );
    }

    return (
        <ul className="flex flex-col gap-2">
            {items.map((q) => {
                const isCurrent = q.id === currentId && q.status === 'pending';
                const isDone = q.status !== 'pending';
                return (
                    <li
                        key={q.id}
                        className={`rounded-xl border px-4 py-3 transition ${
                            isCurrent
                                ? 'border-primary/50 bg-primary/10'
                                : isDone
                                  ? 'border-border-subtle bg-bg-overlay/40 opacity-70'
                                  : 'border-border-subtle bg-bg-overlay'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-text-main">
                                        {q.displayName}
                                    </span>
                                    <span className="text-[0.7rem] text-text-muted">{formatTime(q.createdAt)}</span>
                                    {isCurrent && (
                                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                                            {qT.currentBadge}
                                        </span>
                                    )}
                                    {q.status === 'answered' && (
                                        <span className="rounded bg-success/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-success">
                                            {qT.statusAnswered}
                                        </span>
                                    )}
                                    {q.status === 'skipped' && (
                                        <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-warning">
                                            {qT.statusSkipped}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[0.875rem] leading-snug text-text-main/90 whitespace-pre-wrap break-words">
                                    {q.text}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                {q.status === 'pending' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onAnswer(q.id)}
                                            title={qT.btnAnswer}
                                            aria-label={qT.btnAnswer}
                                            className={`rounded-lg border-none p-1.5 text-success ${hoverNeutralIconBtn}`}
                                        >
                                            <Check className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onSkip(q.id)}
                                            title={qT.btnSkip}
                                            aria-label={qT.btnSkip}
                                            className={`rounded-lg border-none p-1.5 text-warning ${hoverNeutralIconBtn}`}
                                        >
                                            <SkipForward className="size-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemove(q.id)}
                                    title={qT.btnRemove}
                                    aria-label={qT.btnRemove}
                                    className={`rounded-lg border-none p-1.5 text-text-muted ${hoverNeutralIconBtn}`}
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
