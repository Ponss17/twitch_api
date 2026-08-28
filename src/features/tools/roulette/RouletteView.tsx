import { Dices, History, Loader2, MessageSquare, Pause, Play, RotateCw, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { useRouletteController } from '@/features/tools/roulette/hooks/useRouletteController';
import { RouletteWheelDisplay } from '@/features/tools/roulette/RouletteWheelDisplay';
import { OverlayUrlButton } from '@/features/overlay/components/OverlayUrlButton';
import { useOverlayPublish } from '@/features/overlay/hooks/useOverlayPublish';
import { fadeIn, hoverSubtleIconBtn, toolPanelShell, toolHeaderIconBtn, toolConfigInput, toolConfigSegment } from '@/core/utils/tw';
import { RouletteEligibilityDropdown } from '@/features/tools/roulette/RouletteEligibilityDropdown';
import { ToolPanelHeader } from '@/features/tools/components/ToolPanelHeader';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useToolFocus } from '@/features/dashboard/lib/ui/ToolFocusContext';

export function RouletteView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const rlT = t.tools.roulette;
    const { showToast } = useToast();
    const { focusMode } = useToolFocus();
    const listRef = useRef<HTMLUListElement>(null);

    const handleStateChange = useOverlayPublish({
        tool: 'roulette',
        session,
        active,
        isCritical: (state) =>
            state.isSpinning || state.winner !== null || !state.isOpen,
        resetCacheWhen: (state) => !state.isOpen || state.winner !== null
    });

    const {
        chatters,
        filters,
        setFilters,
        isOpen,
        isSpinning,
        winner,
        countPulse,
        lastSpinCount,
        announceWinnerInChat,
        entryMode,
        setEntryMode,
        keywordInput,
        setKeywordInput,
        winnerHistory,
        clearHistory,
        wheelRotation,
        wheelTransition,
        toggleOpen,
        loadChatters,
        spin,
        onWheelTransitionEnd,
        toggleAnnounceWinner,
        dismissWinner,
        removeWinnerAndRespin
    } = useRouletteController({
        session,
        active,
        onStateChange: handleStateChange,
        showToast
    });

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [chatters]);

    const entryLocked = isOpen || isSpinning;

    return (
        <div className={`${toolPanelShell(focusMode)} ${focusMode ? '' : fadeIn}`}>
            <ToolPanelHeader
                icon={Dices}
                title={rlT.title}
                description={rlT.desc}
                primaryAction={
                    <button
                        type="button"
                        onClick={() => void toggleOpen()}
                        title={isOpen ? rlT.pauseEntries : rlT.openEntries}
                        aria-label={isOpen ? rlT.pauseEntries : rlT.openEntries}
                        className={`${toolHeaderIconBtn} ${
                            isOpen
                                ? 'text-warning hover:bg-warning/10'
                                : 'text-success hover:bg-success/10'
                        }`}
                    >
                        {isOpen ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </button>
                }
                config={
                    <>
                        <RouletteEligibilityDropdown
                            filters={filters}
                            disabled={isSpinning}
                            onChange={setFilters}
                        />
                        <div className={toolConfigSegment}>
                            <button
                                type="button"
                                disabled={entryLocked}
                                onClick={() => setEntryMode('presence')}
                                className={`inline-flex h-full items-center rounded-md px-2.5 text-[0.75rem] font-medium leading-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    entryMode === 'presence'
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-text-muted hover:bg-white/[0.06] hover:text-text-main'
                                }`}
                            >
                                {rlT.entryPresence}
                            </button>
                            <button
                                type="button"
                                disabled={entryLocked}
                                onClick={() => setEntryMode('keyword')}
                                className={`inline-flex h-full items-center rounded-md px-2.5 text-[0.75rem] font-medium leading-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    entryMode === 'keyword'
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-text-muted hover:bg-white/[0.06] hover:text-text-main'
                                }`}
                            >
                                {rlT.entryKeyword}
                            </button>
                        </div>
                        {entryMode === 'keyword' ? (
                            <div className="relative w-[140px]">
                                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[0.75rem] font-bold leading-none text-text-muted">
                                    !
                                </span>
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    disabled={entryLocked}
                                    className={`${toolConfigInput} pl-6`}
                                    placeholder={rlT.keywordPlaceholder}
                                    aria-label={rlT.keywordLabel}
                                />
                            </div>
                        ) : null}
                        <span
                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-2 text-[0.6875rem] font-bold leading-none tracking-wide text-brand-text transition ${
                                countPulse ? 'scale-110 text-[#3b82f6]' : ''
                            }`}
                        >
                            {chatters.length}
                        </span>
                    </>
                }
                trailing={
                    <>
                        <button
                            type="button"
                            onClick={toggleAnnounceWinner}
                            disabled={isSpinning}
                            title={
                                announceWinnerInChat
                                    ? rlT.announceChatOn
                                    : rlT.announceChatOff
                            }
                            aria-pressed={announceWinnerInChat}
                            aria-label={
                                announceWinnerInChat
                                    ? rlT.announceChatOn
                                    : rlT.announceChatOff
                            }
                            className={`${toolHeaderIconBtn} disabled:opacity-50 ${
                                announceWinnerInChat ? 'bg-primary/10 text-primary' : ''
                            }`}
                        >
                            <MessageSquare className="size-4" />
                        </button>
                        {entryMode === 'presence' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    void loadChatters({ force: true });
                                    showToast(rlT.listUpdated, 'success');
                                }}
                                disabled={!isOpen || isSpinning}
                                title={rlT.reloadUsers}
                                aria-label={rlT.reloadUsers}
                                className={toolHeaderIconBtn}
                            >
                                <RotateCw className="size-4" />
                            </button>
                        ) : null}
                        <OverlayUrlButton tool="roulette" compact />
                        <InfoTooltip text={rlT.infoTooltip} />
                    </>
                }
            />

            <div
                className={`min-h-0 flex-1 overflow-y-auto p-5 ${
                    focusMode ? 'flex flex-col' : ''
                }`}
            >
                <div
                    className={
                        focusMode
                            ? 'mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center'
                            : ''
                    }
                >
                    <RouletteWheelDisplay
                        chatters={chatters}
                        wheelRotation={wheelRotation}
                        wheelTransition={wheelTransition}
                        isSpinning={isSpinning}
                        winner={winner}
                        lastSpinCount={lastSpinCount}
                        wheelColor="auto"
                        variant="full"
                        announceWinnerInChat={announceWinnerInChat}
                        onWheelTransitionEnd={onWheelTransitionEnd}
                        onDismissWinner={dismissWinner}
                        onRespinWithoutWinner={removeWinnerAndRespin}
                    />

                    <div className="mt-5 text-center">
                        <button
                            type="button"
                            onClick={spin}
                            disabled={isSpinning || chatters.length === 0}
                            className="inline-flex items-center gap-2.5 rounded-full bg-primary px-10 py-3.5 text-[1rem] font-semibold text-white transition hover:-translate-y-0.5 hover:scale-105 hover:bg-primary-hover active:translate-y-px disabled:opacity-50 disabled:hover:scale-100 max-[480px]:w-full max-[480px]:justify-center max-[480px]:px-8 max-[480px]:py-3 max-[480px]:text-[0.9375rem]"
                        >
                            {isSpinning ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            {isSpinning ? rlT.spinning : rlT.spinBtn}
                        </button>
                    </div>

                    <p className="mt-2.5 text-center text-[0.6875rem] italic opacity-60">
                        {entryMode === 'keyword' ? rlT.keywordHint : rlT.twitchDelay}
                    </p>

                    {(isOpen || chatters.length > 0) && (
                        <div className="mt-4 text-left">
                            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-text-muted">
                                {rlT.participants} ({chatters.length})
                            </p>
                            <ul
                                ref={listRef}
                                className="max-h-[200px] overflow-y-auto overflow-x-hidden rounded-lg border border-border-strong bg-bg-secondary p-1"
                            >
                                {chatters.length === 0 ? (
                                    <li className="px-3 py-4 text-center text-[0.75rem] text-text-muted">
                                        {entryMode === 'keyword'
                                            ? rlT.waitingKeyword
                                            : rlT.waitingChat}
                                    </li>
                                ) : (
                                    chatters.map((u) => (
                                        <li
                                            key={u.user_login}
                                            className="flex items-center gap-2 border-b border-border-subtle px-3 py-2 text-[0.8rem] last:border-0"
                                        >
                                            <span className="truncate font-semibold text-text-main">
                                                {u.user_name}
                                            </span>
                                            <span className="ml-auto flex shrink-0 gap-1">
                                                {u.sub && (
                                                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-brand-text">
                                                        SUB
                                                    </span>
                                                )}
                                                {u.mod && (
                                                    <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-green-400">
                                                        MOD
                                                    </span>
                                                )}
                                                {u.vip && (
                                                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-amber-400">
                                                        VIP
                                                    </span>
                                                )}
                                            </span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )}

                    {winnerHistory.length > 0 && (
                        <div className="mt-4 text-left">
                            <div className="mb-2 flex items-center gap-2">
                                <History className="h-3.5 w-3.5 text-text-muted" />
                                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-text-muted">
                                    {rlT.historyTitle}
                                </p>
                                <button
                                    type="button"
                                    onClick={clearHistory}
                                    title={rlT.historyClear}
                                    aria-label={rlT.historyClear}
                                    className={`ml-auto rounded-lg border-none px-2 py-0.5 text-text-muted ${hoverSubtleIconBtn}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <ul className="max-h-[140px] overflow-y-auto rounded-lg border border-border-subtle bg-bg-overlay/40 p-1">
                                {winnerHistory.map((h) => (
                                    <li
                                        key={`${h.user_login}-${h.at}`}
                                        className="flex items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-[0.75rem] last:border-0"
                                    >
                                        <span className="truncate font-medium text-text-main">
                                            {h.user_name}
                                        </span>
                                        <span className="ml-auto shrink-0 text-text-muted">
                                            {new Date(h.at).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
