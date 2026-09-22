interface OverlayStatusBannerProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function OverlayStatusBanner({ message, actionLabel, onAction }: OverlayStatusBannerProps) {
    return (
        <p className="mb-2 flex items-center gap-3 rounded-lg bg-black/60 px-4 py-2 text-[0.75rem] text-text-muted backdrop-blur-sm">
            <span className="min-w-0 flex-1">{message}</span>
            {actionLabel && onAction ? (
                <button
                    type="button"
                    onClick={onAction}
                    className="shrink-0 rounded-md border border-white/20 px-2 py-0.5 text-[0.7rem] font-semibold text-text-main hover:bg-white/10"
                >
                    {actionLabel}
                </button>
            ) : null}
        </p>
    );
}
