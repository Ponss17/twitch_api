interface OverlayStatusBannerProps {
    message: string;
}

export function OverlayStatusBanner({ message }: OverlayStatusBannerProps) {
    return (
        <p className="mb-2 rounded-lg bg-black/60 px-4 py-2 text-[0.75rem] text-[#a1a1aa] backdrop-blur-sm">
            {message}
        </p>
    );
}
