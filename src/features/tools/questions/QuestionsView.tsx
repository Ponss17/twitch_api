import { MessageCircleQuestion, Play, Pause, Square, Trash2, Eraser } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useQuestions } from './hooks/useQuestions';
import { QuestionsList } from './components/QuestionsList';
import { RouletteEligibilityDropdown } from '@/features/tools/roulette/RouletteEligibilityDropdown';
import { OverlayUrlButton } from '@/features/overlay/components/OverlayUrlButton';
import { useOverlayPublish } from '@/features/overlay/hooks/useOverlayPublish';
import { hoverSubtleIconBtn, panelCard, fadeIn, textInput } from '@/core/utils/tw';
import { InlineIcon } from '@/shared/ui/Icon';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useRequiredSession } from '@/core/session/useSession';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import type { QuestionsOverlayState } from '@/features/overlay/lib/types';

export function QuestionsView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const qT = t.tools.questions;

    const {
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
        clearDone,
        loadingHistory,
        maxItems,
        maxAgeDays
    } = useQuestions({ tabActive: active });

    const publishOverlay = useOverlayPublish({
        tool: 'questions',
        session,
        active,
        shouldSkip: (state) => !active && !state.isActive && !state.current,
        isCritical: () => true,
        resetCacheWhen: (state) => !state.isActive && !state.current
    });

    const overlayState = useMemo<QuestionsOverlayState>(
        () => ({
            isActive,
            keyword,
            pendingCount: Math.max(0, pending.length - (current ? 1 : 0)),
            current: current ? { displayName: current.displayName, text: current.text } : null,
            updatedAt: Date.now()
        }),
        [isActive, keyword, pending.length, current]
    );

    useEffect(() => {
        publishOverlay(overlayState);
    }, [overlayState, publishOverlay]);

    return (
        <div className={`${panelCard} ${fadeIn} mb-3 flex min-h-[500px] flex-col`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5 max-md:flex-col max-md:items-start">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                    >
                        <MessageCircleQuestion className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <h2 className="truncate text-base font-bold text-text-main">
                            {qT.title} ({session.login})
                        </h2>
                        <span className="truncate text-[0.8125rem] text-text-muted">{qT.description}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:justify-between">
                    <span
                        className={`inline-flex items-center gap-1.5 text-[0.8125rem] ${
                            isActive ? 'text-success' : 'text-text-muted'
                        }`}
                    >
                        {isActive ? (
                            <>
                                <InlineIcon icon={Play} className="animate-pulse" />
                                {qT.status.active}
                            </>
                        ) : (
                            <>
                                <InlineIcon icon={Pause} className="text-text-muted opacity-70" />
                                {qT.status.inactive}
                            </>
                        )}
                    </span>

                    <div className="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:flex-col max-md:items-stretch">
                        <RouletteEligibilityDropdown filters={filters} onChange={setFilters} />

                        <div className="relative w-[180px] max-md:w-full">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[0.8125rem] font-bold text-text-muted">
                                !
                            </span>
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeyword(e.target.value)}
                                disabled={isActive}
                                className={`${textInput} pl-7`}
                                placeholder={qT.keywordPlaceholder}
                                aria-label={qT.keywordLabel}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={toggleListening}
                            title={isActive ? qT.btnStop : qT.btnStart}
                            aria-label={isActive ? qT.btnStop : qT.btnStart}
                            className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] transition ${
                                isActive
                                    ? 'text-warning hover:bg-warning/10'
                                    : 'text-success hover:bg-success/10'
                            }`}
                        >
                            {isActive ? (
                                <Square className="size-4 shrink-0" />
                            ) : (
                                <Play className="size-4 shrink-0" />
                            )}
                        </button>

                        <div className="mx-0.5 h-4 w-px bg-border-strong" />

                        <button
                            type="button"
                            onClick={clearDone}
                            disabled={items.every((q) => q.status === 'pending')}
                            title={qT.btnClearDone}
                            aria-label={qT.btnClearDone}
                            className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] text-text-muted disabled:cursor-not-allowed disabled:opacity-40 ${hoverSubtleIconBtn}`}
                        >
                            <Eraser className="size-4 shrink-0" />
                        </button>

                        <button
                            type="button"
                            onClick={clearAll}
                            disabled={items.length === 0 && !isActive}
                            title={qT.btnClear}
                            aria-label={qT.btnClear}
                            className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] text-text-muted disabled:cursor-not-allowed disabled:opacity-40 ${hoverSubtleIconBtn}`}
                        >
                            <Trash2 className="size-4 shrink-0" />
                        </button>
                    </div>

                    <OverlayUrlButton tool="questions" />
                    <InfoTooltip text={qT.tooltip} />
                </div>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-muted">
                    <MessageCircleQuestion className="size-4" />
                    {qT.listTitle}
                    <span className="rounded-full bg-border-strong px-2 py-0.5 text-xs text-text-main">
                        {pending.length}
                    </span>
                    {items.length > pending.length && (
                        <span className="text-[0.75rem] font-normal text-text-muted">
                            · {items.length - pending.length} {qT.doneCount}
                        </span>
                    )}
                </div>
                <p className="mb-3 text-[0.75rem] text-text-muted">
                    {qT.retentionHint
                        .replace('{max}', String(maxItems))
                        .replace('{days}', String(maxAgeDays))}
                </p>

                <div className="flex-1 overflow-y-auto">
                    {loadingHistory ? (
                        <p className="py-8 text-center text-[0.8125rem] text-text-muted">{t.common.loading}</p>
                    ) : (
                        <QuestionsList
                            items={items}
                            currentId={current?.id ?? null}
                            onAnswer={markAnswered}
                            onSkip={markSkipped}
                            onRemove={removeItem}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
