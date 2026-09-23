/** Aguja de la ruleta: punta hacia abajo (hacia el disco cuando está arriba). */
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
                d="M14 32 L25 4 Q14 8 3 4 Z"
                fill="#fafafa"
                stroke={stroke}
                strokeWidth="1"
            />
            <circle cx="14" cy="27" r="3.5" fill={color} />
        </svg>
    );
}
