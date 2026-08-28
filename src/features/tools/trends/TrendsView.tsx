import {
    Circle,
    Power,
    Loader2,
    Network,
    BarChart2,
    Minus,
    Plus,
    Play,
    Clock,
    RotateCw
} from 'lucide-react';
import { useRequiredSession } from '@/core/session/useSession';
import { useTrendsController } from '@/features/tools/trends/hooks/useTrendsController';
import { TrendsLeaderboardDisplay } from '@/features/tools/trends/TrendsLeaderboardDisplay';
import { formatTrendsTime } from '@/features/tools/trends/TrackerRow';
import { OverlayUrlButton } from '@/features/overlay/components/OverlayUrlButton';
import { useOverlayPublish } from '@/features/overlay/hooks/useOverlayPublish';
import { fadeIn, hoverSubtleIconBtn, toolPanelShell, toolHeaderIconBtn, toolConfigControl } from '@/core/utils/tw';
import { ToolPanelHeader } from '@/features/tools/components/ToolPanelHeader';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { InlineIcon } from '@/shared/ui/Icon';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useToolFocus } from '@/features/dashboard/lib/ui/ToolFocusContext';

export function TrendsView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const trends = t.tools.trends;
    const { showToast } = useToast();
    const { focusMode } = useToolFocus();

    const handleStateChange = useOverlayPublish({
        tool: 'trends',
        session,
        active,
        shouldSkip: (state) => !active && !state.tracking,
        isCritical: (state) =>
            !state.tracking ||
            state.timerEnded ||
            (state.tracking && state.remaining >= state.minutes * 60),
        resetCacheWhen: (state) => !state.tracking || state.timerEnded
    });

    const {
        minutes,
        adjustMinutes,
        applyMinutesInput,
        tracking,
        connected,
        remaining,
        timerEnded,
        sessionActive,
        isLeader,
        ranked,
        maxCount,
        displayName,
        startTracking,
        reset
    } = useTrendsController({
        session,
        active,
        onStateChange: handleStateChange,
        showToast
    });

    const statusContent = connected ? (
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-success">
            <InlineIcon icon={Circle} className="fill-current" />
            {trends.status.connected}
        </span>
    ) : !tracking ? (
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-text-muted">
            <InlineIcon icon={Power} />
            {trends.status.idle}
        </span>
    ) : isLeader ? (
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-warning">
            <InlineIcon icon={Loader2} className="animate-spin" />
            {trends.status.connecting}
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-success">
            <InlineIcon icon={Network} />
            {trends.status.synced}
        </span>
    );

    return (
        <div className={`${toolPanelShell(focusMode)} ${focusMode ? '' : fadeIn}`}>
            <ToolPanelHeader
                icon={BarChart2}
                title={trends.title(displayName)}
                description={trends.info}
                status={statusContent}
                primaryAction={
                    tracking ? (
                        <div
                            className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5"
                            role="timer"
                            aria-live="polite"
                            aria-label={trends.countdown(formatTrendsTime(remaining))}
                        >
                            <Clock className="size-4 text-warning" />
                            <span
                                className={`min-w-[3.5rem] text-center font-[Consolas,monospace] text-[1rem] font-bold tracking-wider text-warning ${
                                    timerEnded ? 'opacity-60' : ''
                                }`}
                            >
                                {formatTrendsTime(remaining)}
                            </span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void startTracking()}
                            title={trends.startTimer}
                            aria-label={trends.startTimer}
                            className={`${toolHeaderIconBtn} text-success hover:bg-success/10`}
                        >
                            <Play className="size-4 shrink-0" />
                        </button>
                    )
                }
                config={
                    !tracking ? (
                        <div className={toolConfigControl}>
                            <span className="text-text-muted">{trends.duration}</span>
                            <button
                                type="button"
                                onClick={() => adjustMinutes(-1)}
                                disabled={minutes <= 1}
                                aria-label={trends.btnDecrease}
                                className={`flex size-6 items-center justify-center rounded-md text-text-muted disabled:cursor-not-allowed disabled:opacity-30 ${hoverSubtleIconBtn}`}
                            >
                                <Minus className="size-3.5" />
                            </button>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={minutes}
                                    onChange={(e) => applyMinutesInput(e.target.value)}
                                    aria-label={trends.inputLabel}
                                    className="w-8 border-none bg-transparent text-center text-[0.8125rem] font-semibold leading-none text-text-main outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <span className="text-text-muted">{trends.min}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => adjustMinutes(1)}
                                disabled={minutes >= 60}
                                aria-label={trends.btnIncrease}
                                className={`flex size-6 items-center justify-center rounded-md text-text-muted disabled:cursor-not-allowed disabled:opacity-30 ${hoverSubtleIconBtn}`}
                            >
                                <Plus className="size-3.5" />
                            </button>
                        </div>
                    ) : (
                        <span className="text-[0.75rem] font-medium uppercase tracking-wide text-warning/80">
                            {trends.remaining}
                        </span>
                    )
                }
                trailing={
                    <>
                        <button
                            type="button"
                            onClick={reset}
                            title={trends.reset}
                            aria-label={trends.reset}
                            className={`${toolHeaderIconBtn} text-warning hover:bg-warning/10`}
                        >
                            <RotateCw className="size-4 shrink-0" />
                        </button>
                        <OverlayUrlButton tool="trends" compact />
                        <InfoTooltip text={trends.tooltip} placement="bottom" />
                    </>
                }
            />

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <TrendsLeaderboardDisplay
                    ranked={ranked}
                    maxCount={maxCount}
                    tracking={tracking}
                    remaining={remaining}
                    timerEnded={timerEnded}
                    sessionActive={sessionActive}
                    displayName={displayName}
                    variant="full"
                />
            </div>
        </div>
    );
}
