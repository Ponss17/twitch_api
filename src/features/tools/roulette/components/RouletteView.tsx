import { Dices, Loader2, MessageSquare, Pause, Play, RotateCw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { useRouletteController } from '@/features/tools/roulette/hooks/useRouletteController';
import { RouletteWheelDisplay } from '@/features/tools/roulette/components/RouletteWheelDisplay';
import { OverlayUrlButton } from '@/features/tools/overlay/components/OverlayUrlButton';
import { useOverlayPublish } from '@/features/tools/overlay/hooks/useOverlayPublish';
import { card, fadeIn } from '@/core/ui/tw';
import { RouletteEligibilityDropdown } from '@/features/tools/roulette/components/RouletteEligibilityDropdown';
import { useToast } from '@/shared/ui/ToastProvider';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';

export function RouletteView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const listRef = useRef<HTMLUListElement>(null);

    const handleStateChange = useOverlayPublish({
        tool: 'roulette',
        session,
        active,
        isCritical: (state) =>
            state.isSpinning ||
            state.winner !== null ||
            state.spinSeq > 0 ||
            !state.isOpen,
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
        <div className={`${card} ${fadeIn} mb-3`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-2 max-md:flex-col max-md:items-start">
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                        <Dices className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Ruleta de Viewers</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">Sortea premios entre los usuarios activos</p>
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
                                ? 'Anunciar ganador en chat (activado)'
                                : 'No anunciar ganador en chat (desactivado)'
                        }
                        aria-pressed={announceWinnerInChat}
                        aria-label={
                            announceWinnerInChat
                                ? 'Anunciar ganador en chat, activado'
                                : 'Anunciar ganador en chat, desactivado'
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.75rem] font-semibold transition hover:bg-white/5 disabled:opacity-50 ${
                            announceWinnerInChat
                                ? 'border-primary/35 bg-primary/10 text-primary'
                                : 'border-white/10 bg-white/[0.03] text-[#71717a]'
                        }`}
                    >
                        <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                        En chat
                    </button>

                    <span
                        className={`inline-block rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-[0.6875rem] font-bold tracking-wide text-[#a78bfa] transition ${
                            countPulse ? 'scale-110 text-[#3b82f6]' : ''
                        }`}
                    >
                        {chatters.length}
                    </span>

                    <button
                        type="button"
                        onClick={() => void toggleOpen()}
                        title={isOpen ? 'Pausar inscripciones' : 'Abrir inscripciones'}
                        aria-label={isOpen ? 'Pausar inscripciones' : 'Abrir inscripciones'}
                        className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] transition hover:bg-white/5 ${
                            isOpen ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'
                        }`}
                    >
                        {isOpen ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            void loadChatters();
                            showToast('Lista actualizada', 'success');
                        }}
                        title="Recargar usuarios"
                        aria-label="Recargar usuarios"
                        className="rounded-lg border-none px-3 py-1 text-[0.8125rem] text-[#c4c4cc] transition hover:bg-white/5 hover:text-[#fafafa]"
                    >
                        <RotateCw className="h-4 w-4" />
                    </button>

                    <OverlayUrlButton tool="roulette" />

                    <InfoTooltip text="Sorteo en vivo. Elige quién puede participar y si el ganador se anuncia en el chat de Twitch (botón Chat)." />
                </div>
            </div>

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
                    className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-primary to-primary-hover px-10 py-3.5 text-[1rem] font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_15px_30px_rgba(168,85,247,0.4)] active:translate-y-px disabled:opacity-50 disabled:hover:scale-100 max-[480px]:w-full max-[480px]:justify-center max-[480px]:px-8 max-[480px]:py-3 max-[480px]:text-[0.9375rem]"
                >
                    {isSpinning ? <Loader2 className="animate-spin" /> : <Play className="h-4 w-4" />}
                    {isSpinning ? 'Girando...' : 'GIRAR RULETA'}
                </button>
            </div>

            <p className="mt-2.5 text-center text-[0.6875rem] italic opacity-60">
                * Twitch tarda unos minutos en actualizar la lista
            </p>

            {(isOpen || chatters.length > 0) && (
                <div className="mt-4 text-left">
                    <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-[#71717a]">
                        Participantes ({chatters.length})
                    </p>
                    <ul
                        ref={listRef}
                        className="max-h-[200px] overflow-y-auto overflow-x-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-1"
                    >
                        {chatters.length === 0 ? (
                            <li className="px-3 py-4 text-center text-[0.75rem] text-[#52525b]">
                                Esperando mensajes en el chat…
                            </li>
                        ) : (
                            chatters.map((u) => (
                                <li
                                    key={u.user_login}
                                    className="flex items-center gap-2 border-b border-white/[0.04] px-3 py-2 text-[0.8rem] last:border-0"
                                >
                                    <span className="truncate font-semibold text-[#fafafa]">
                                        {u.user_name}
                                    </span>
                                    <span className="ml-auto flex shrink-0 gap-1">
                                        {u.sub && (
                                            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-primary">
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
    );
}
