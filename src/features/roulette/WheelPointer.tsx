export function WheelPointer({
    color = 'var(--primary)',
    stroke = 'rgba(255,255,255,0.35)'
}: {
    color?: string;
    stroke?: string;
}) {
    return (
        <svg
            width="28"
            height="34"
            viewBox="0 0 28 34"
            className="drop-shadow-md"
            aria-hidden
        >
            <path
                d="M14 2 L25 30 Q14 26 3 30 Z"
                fill="#fafafa"
                stroke={stroke}
                strokeWidth="1"
            />
            <circle cx="14" cy="7" r="3.5" fill={color} />
        </svg>
    );
}
