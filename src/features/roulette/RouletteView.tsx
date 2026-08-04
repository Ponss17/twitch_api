import { Dices, Loader2, MessageSquare, Pause, Play, RotateCw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { useRouletteController } from '@/features/roulette/hooks/useRouletteController';
import { RouletteWheelDisplay } from '@/features/roulette/RouletteWheelDisplay';
import { OverlayUrlButton } from '@/features/overlay/components/OverlayUrlButton';
import { useOverlayPublish } from '@/features/overlay/hooks/useOverlayPublish';
import { fadeIn, hoverSubtleChip, hoverSubtleIconBtn, panelCard } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { RouletteEligibilityDropdown } from '@/features/roulette/RouletteEligibilityDropdown';
import { useToast } from '@/shared/ui/ToastProvider';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { useTranslation } from '@/core/i18n/I18nContext';

export function RouletteView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const rlT = t.minigames.roulette;
    const { showToast } = useToast();
    const listRef = useRef<HTMLUListElement>(null);

    const handleStateChange = useOverlayPublish({
        tool: 'roulette',
        session,
        active,
        // Crítico: spin / ganador / cerrado. Chatters con inscripción abierta → debounce 500ms.
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
        wheelRotation,
        wheelTransition,
        toggleOpen,
        loadChatters,
        spin,
        onWheelTransitionEnd,
        toggleAnnounceWinner,
        dismissWinner
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

    return (
        <div className={`${panelCard} ${fadeIn} mb-3 flex flex-col`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5 max-md:flex-col max-md:items-start">
                <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}>
                        <Dices className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">
                            {rlT.title}
                        </h2>
                        <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">
                            {rlT.desc}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 max-md:w-full">
                    <RouletteEligibilityDropdown
                        filters={filters}
                        disabled={isSpinning}
                        onChange={setFilters}
                    />

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
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.75rem] font-semibold disabled:opacity-50 ${
                            announceWinnerInChat
                                ? 'border-primary/35 bg-primary/10 text-brand-text'
                                : `border-border-subtle bg-bg-secondary text-text-muted ${hoverSubtleChip}`
                        }`}
                    >
                        <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                        {rlT.inChat}
                    </button>

                    <span
                        className={`inline-block rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-[0.6875rem] font-bold tracking-wide text-brand-text transition ${
                            countPulse ? 'scale-110 text-[#3b82f6]' : ''
                        }`}
                    >
                        {chatters.length}
                    </span>

                    <button
                        type="button"
                        onClick={() => void toggleOpen()}
                        title={isOpen ? rlT.pauseEntries : rlT.openEntries}
                        aria-label={isOpen ? rlT.pauseEntries : rlT.openEntries}
                        className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] transition ${
                            isOpen ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'
                        }`}
                    >
                        {isOpen ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            void loadChatters();
                            showToast(rlT.listUpdated, 'success');
                        }}
                        title={rlT.reloadUsers}
                        aria-label={rlT.reloadUsers}
                        className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] text-text-muted ${hoverSubtleIconBtn}`}
                    >
                        <RotateCw className="h-4 w-4" />
                    </button>

                    <OverlayUrlButton tool="roulette" />

                    <InfoTooltip text={rlT.infoTooltip} />
                </div>
            </header>

            <div className="p-5">
            <RouletteWheelDisplay
                chatters={chatters}
                wheelRotation={wheelRotation}
                wheelTransition={wheelTransition}
                isSpinning={isSpinning}
                winner={winner}
                lastSpinCount={lastSpinCount}
                variant="full"
                announceWinnerInChat={announceWinnerInChat}
                onWheelTransitionEnd={onWheelTransitionEnd}
                onDismissWinner={dismissWinner}
            />

            <div className="mt-5 text-center">
                <button
                    type="button"
                    onClick={spin}
                    disabled={isSpinning || chatters.length === 0}
                    className="inline-flex items-center gap-2.5 rounded-full bg-primary px-10 py-3.5 text-[1rem] font-semibold text-white transition hover:-translate-y-0.5 hover:scale-105 hover:bg-primary-hover active:translate-y-px disabled:opacity-50 disabled:hover:scale-100 max-[480px]:w-full max-[480px]:justify-center max-[480px]:px-8 max-[480px]:py-3 max-[480px]:text-[0.9375rem]"
                >
                    {isSpinning ? <Loader2 className="animate-spin" /> : <Play className="h-4 w-4" />}
                    {isSpinning ? rlT.spinning : rlT.spinBtn}
                </button>
            </div>

            <p className="mt-2.5 text-center text-[0.6875rem] italic opacity-60">
                {rlT.twitchDelay}
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
                                {rlT.waitingChat}
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
            </div>
        </div>
    );
}
