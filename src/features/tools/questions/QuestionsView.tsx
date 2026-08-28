import { Eraser, History, MessageCircleQuestion, Play, Pause, Square, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuestions } from './hooks/useQuestions';
import { QuestionsList } from './components/QuestionsList';
import { QuestionsHistoryModal } from './components/QuestionsHistoryModal';
import { ToolPanelHeader } from '@/features/tools/components/ToolPanelHeader';
import { ToolMoreMenu } from '@/features/tools/components/ToolMoreMenu';
import { RouletteEligibilityDropdown } from '@/features/tools/roulette/RouletteEligibilityDropdown';
import { OverlayUrlButton } from '@/features/overlay/components/OverlayUrlButton';
import { useOverlayPublish } from '@/features/overlay/hooks/useOverlayPublish';
import { toolPanelShell, fadeIn, toolConfigInput, toolHeaderIconBtn } from '@/core/utils/tw';
import { InlineIcon } from '@/shared/ui/Icon';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useRequiredSession } from '@/core/session/useSession';
import type { QuestionsOverlayState } from '@/features/overlay/lib/types';
import { useToolFocus } from '@/features/dashboard/lib/ui/ToolFocusContext';

export function QuestionsView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const qT = t.tools.questions;
    const { focusMode } = useToolFocus();
    const [historyOpen, setHistoryOpen] = useState(false);

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

    const moreItems = useMemo(
        () => [
            {
                id: 'history',
                label: qT.btnHistory,
                icon: History,
                onClick: () => setHistoryOpen(true)
            },
            {
                id: 'clear-done',
                label: qT.btnClearDone,
                icon: Eraser,
                onClick: clearDone,
                disabled: items.every((q) => q.status === 'pending'),
                dividerBefore: true
            },
            {
                id: 'clear-all',
                label: qT.btnClear,
                icon: Trash2,
                onClick: clearAll,
                disabled: items.length === 0 && !isActive,
                variant: 'danger' as const
            }
        ],
        [qT, clearDone, clearAll, items, isActive]
    );

    return (
        <div
            className={`${toolPanelShell(focusMode)} ${
                focusMode ? 'min-h-0' : `min-h-[500px] ${fadeIn}`
            }`}
        >
            <ToolPanelHeader
                icon={MessageCircleQuestion}
                title={`${qT.title} (${session.login})`}
                description={qT.description}
                status={
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
                }
                primaryAction={
                    <button
                        type="button"
                        onClick={toggleListening}
                        title={isActive ? qT.btnStop : qT.btnStart}
                        aria-label={isActive ? qT.btnStop : qT.btnStart}
                        className={`${toolHeaderIconBtn} ${
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
                }
                config={
                    <>
                        <RouletteEligibilityDropdown filters={filters} onChange={setFilters} />
                        <div className="relative w-[160px] max-md:w-full">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[0.8125rem] font-bold leading-none text-text-muted">
                                !
                            </span>
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeyword(e.target.value)}
                                disabled={isActive}
                                className={`${toolConfigInput} pl-7`}
                                placeholder={qT.keywordPlaceholder}
                                aria-label={qT.keywordLabel}
                            />
                        </div>
                    </>
                }
                trailing={
                    <>
                        <OverlayUrlButton tool="questions" compact />
                        <ToolMoreMenu items={moreItems} helpText={qT.tooltip} />
                    </>
                }
            />

            <div className="flex flex-1 flex-col overflow-hidden p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-text-muted">
                    <MessageCircleQuestion className="size-4" />
                    {qT.listTitle}
                    <span className="rounded-full bg-border-strong px-2 py-0.5 text-xs text-text-main">
                        {pending.length}
                    </span>
                    {items.length > pending.length ? (
                        <button
                            type="button"
                            onClick={() => setHistoryOpen(true)}
                            className="rounded-md px-1.5 py-0.5 text-[0.75rem] font-normal text-text-muted underline-offset-2 hover:text-text-main hover:underline"
                        >
                            · {items.length - pending.length} {qT.doneCount}
                        </button>
                    ) : null}
                </div>
                <p className="mb-3 text-[0.75rem] text-text-muted">
                    {qT.retentionHint
                        .replace('{max}', String(maxItems))
                        .replace('{days}', String(maxAgeDays))}
                </p>

                <div className="flex-1 overflow-y-auto">
                    {loadingHistory ? (
                        <p className="py-8 text-center text-[0.8125rem] text-text-muted">
                            {t.common.loading}
                        </p>
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

            <QuestionsHistoryModal
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                items={items}
                onAnswer={markAnswered}
                onSkip={markSkipped}
                onRemove={removeItem}
                maxItems={maxItems}
                maxAgeDays={maxAgeDays}
            />
        </div>
    );
}
