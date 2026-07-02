import type { RouletteUser } from '@/core/types/twitch';

/** Paleta morada/violeta alineada al brand; alterna tonos para distinguir segmentos */
const WHEEL_HUES = [272, 258, 286, 248, 278, 264, 282, 252] as const;

export function segmentColors(index: number): { inner: string; outer: string; divider: string } {
    const hue = WHEEL_HUES[index % WHEEL_HUES.length];
    const even = index % 2 === 0;
    return {
        inner: even ? `hsl(${hue} 52% 46%)` : `hsl(${hue} 48% 38%)`,
        outer: even ? `hsl(${hue} 55% 30%)` : `hsl(${hue} 50% 24%)`,
        divider: 'rgba(255,255,255,0.14)'
    };
}

export function truncateLabel(name: string, max = 12): string {
    return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function normalizeDegrees(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

export function winnerIndex(rotationDeg: number, participantCount: number): number {
    if (participantCount <= 1) return 0;
    const arcDeg = 360 / participantCount;
    const degrees = normalizeDegrees(rotationDeg);
    const index = Math.floor(((360 - ((degrees + 90) % 360)) % 360) / arcDeg);
    return index % participantCount;
}

export function drawEmptyWheel(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const outsideRadius = 200;
    const insideRadius = 52;

    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0810';
    ctx.fill();

    const emptyGrad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
    emptyGrad.addColorStop(0, 'hsl(272 45% 22%)');
    emptyGrad.addColorStop(1, 'hsl(268 40% 14%)');

    ctx.fillStyle = emptyGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
    ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI, true);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(145, 70, 255, 0.45)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(145, 70, 255, 0.35)';
    ctx.stroke();
}

export function drawWheelOnCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    users: RouletteUser[],
    options: { labels?: boolean } = {}
): void {
    const showLabels = options.labels !== false;
    const cx = w / 2;
    const cy = h / 2;
    const outsideRadius = 200;
    const textRadius = 148;
    const insideRadius = 52;
    const len = users.length;

    ctx.clearRect(0, 0, w, h);
    if (len === 0) {
        drawEmptyWheel(ctx, w, h);
        return;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#07050c';
    ctx.fill();

    if (len === 1) {
        const ringGrad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
        ringGrad.addColorStop(0, 'hsl(272 58% 52%)');
        ringGrad.addColorStop(1, 'hsl(268 55% 32%)');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
        ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI, true);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();
    } else {
        const segments = len;
        const arc = (Math.PI * 2) / segments;

        for (let i = 0; i < segments; i++) {
            const angle = i * arc;
            const { inner, outer, divider } = segmentColors(i);
            const participant = users[i];

            const grad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
            grad.addColorStop(0, inner);
            grad.addColorStop(1, outer);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outsideRadius, angle, angle + arc, false);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * insideRadius, cy + Math.sin(angle) * insideRadius);
            ctx.lineTo(cx + Math.cos(angle) * outsideRadius, cy + Math.sin(angle) * outsideRadius);
            ctx.strokeStyle = divider;
            ctx.lineWidth = 2;
            ctx.stroke();

            if (showLabels) {
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${segments > 16 ? 10 : segments > 10 ? 11 : 13}px Inter, system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.85)';
                ctx.shadowBlur = 4;
                const labelAngle = angle + arc / 2;
                ctx.translate(
                    cx + Math.cos(labelAngle) * textRadius,
                    cy + Math.sin(labelAngle) * textRadius
                );
                ctx.rotate(labelAngle + Math.PI / 2);
                ctx.fillText(truncateLabel(participant.user_name, segments > 12 ? 8 : 12), 0, 0);
                ctx.restore();
            }
        }
    }

    ctx.beginPath();
    ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(145, 70, 255, 0.65)';
    ctx.stroke();
}
