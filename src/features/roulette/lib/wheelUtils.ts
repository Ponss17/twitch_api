import type { RouletteUser } from '@/core/types/twitch';

export interface RouletteColorOption {
    id: string;
    label: string;
    hex: string;
    isAuto?: boolean;
}

export const ROULETTE_COLOR_PRESETS: RouletteColorOption[] = [
    { id: 'auto', label: 'Auto (Tema)', hex: 'var(--primary)', isAuto: true },
    { id: 'purple', label: 'Morado Twitch', hex: '#9146ff' },
    { id: 'matrix', label: 'Verde Matrix', hex: '#00ff66' },
    { id: 'liga', label: 'Rojo Liga', hex: '#ef4444' },
    { id: 'cyan', label: 'Azul Eléctrico', hex: '#00f0ff' },
    { id: 'amber', label: 'Ámbar / Oro', hex: '#f59e0b' },
    { id: 'silver', label: 'Plata / Minimal', hex: '#ffffff' }
];

export interface WheelPalette {
    primaryHex: string;
    glowRgba: string;
    borderRgba: string;
    hues?: number[];
    isMonochrome?: boolean;
    centerBg: string;
    outerBg: string;
}

function hexToHue(hex: string): number {
    const clean = hex.replace('#', '');
    if (clean.length !== 6 && clean.length !== 3) return 272;
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    if (max === min) return 0;
    const d = max - min;
    switch (max) {
        case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
        case g:
            h = (b - r) / d + 2;
            break;
        case b:
            h = (r - g) / d + 4;
            break;
    }
    return Math.round(h * 60);
}

export function resolveWheelPalette(colorInput?: string): WheelPalette {
    const mode = (colorInput || 'auto').toLowerCase();

    if (mode === 'auto') {
        if (typeof document !== 'undefined') {
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'matrix') return resolveWheelPalette('matrix');
            if (theme === 'liga') return resolveWheelPalette('liga');
            if (theme === 'minimal') return resolveWheelPalette('silver');
        }
        return resolveWheelPalette('purple');
    }

    if (mode === 'matrix' || mode === 'green') {
        return {
            primaryHex: '#00ff66',
            glowRgba: 'rgba(0, 255, 102, 0.45)',
            borderRgba: 'rgba(0, 255, 102, 0.65)',
            hues: [142, 155, 132, 160, 148, 136, 152, 130],
            centerBg: '#050805',
            outerBg: '#000000'
        };
    }

    if (mode === 'liga' || mode === 'red') {
        return {
            primaryHex: '#ef4444',
            glowRgba: 'rgba(239, 68, 68, 0.45)',
            borderRgba: 'rgba(239, 68, 68, 0.65)',
            hues: [356, 4, 348, 12, 352, 8, 344, 16],
            centerBg: '#0a0505',
            outerBg: '#050202'
        };
    }

    if (mode === 'cyan' || mode === 'blue') {
        return {
            primaryHex: '#00f0ff',
            glowRgba: 'rgba(0, 240, 255, 0.45)',
            borderRgba: 'rgba(0, 240, 255, 0.65)',
            hues: [192, 204, 185, 212, 198, 180, 208, 188],
            centerBg: '#040a10',
            outerBg: '#020508'
        };
    }

    if (mode === 'amber' || mode === 'gold') {
        return {
            primaryHex: '#f59e0b',
            glowRgba: 'rgba(245, 158, 11, 0.45)',
            borderRgba: 'rgba(245, 158, 11, 0.65)',
            hues: [38, 48, 30, 52, 42, 26, 45, 34],
            centerBg: '#0f0a04',
            outerBg: '#080502'
        };
    }

    if (mode === 'silver' || mode === 'minimal') {
        return {
            primaryHex: '#ffffff',
            glowRgba: 'rgba(255, 255, 255, 0.4)',
            borderRgba: 'rgba(255, 255, 255, 0.6)',
            isMonochrome: true,
            centerBg: '#121212',
            outerBg: '#000000'
        };
    }

    if (mode === 'purple' || mode === 'dark' || mode === 'light') {
        return {
            primaryHex: '#9146ff',
            glowRgba: 'rgba(145, 70, 255, 0.45)',
            borderRgba: 'rgba(145, 70, 255, 0.65)',
            hues: [272, 258, 286, 248, 278, 264, 282, 252],
            centerBg: '#18181b',
            outerBg: '#07050c'
        };
    }

    // Custom HEX or color string (e.g. #ff007f)
    const baseHue = hexToHue(mode);
    return {
        primaryHex: mode.startsWith('#') ? mode : `hsl(${baseHue}, 100%, 50%)`,
        glowRgba: `hsla(${baseHue}, 80%, 60%, 0.45)`,
        borderRgba: `hsla(${baseHue}, 80%, 60%, 0.65)`,
        hues: [
            baseHue,
            (baseHue + 12) % 360,
            (baseHue - 12 + 360) % 360,
            (baseHue + 20) % 360,
            (baseHue - 8 + 360) % 360,
            (baseHue + 6) % 360
        ],
        centerBg: '#0f0f12',
        outerBg: '#050508'
    };
}

export function segmentColors(
    index: number,
    palette: WheelPalette = resolveWheelPalette('purple')
): { inner: string; outer: string; divider: string } {
    const even = index % 2 === 0;

    if (palette.isMonochrome) {
        return {
            inner: even ? 'hsl(0 0% 36%)' : 'hsl(0 0% 24%)',
            outer: even ? 'hsl(0 0% 22%)' : 'hsl(0 0% 14%)',
            divider: 'rgba(255,255,255,0.2)'
        };
    }

    const hues = palette.hues && palette.hues.length > 0 ? palette.hues : [272];
    const hue = hues[index % hues.length];
    return {
        inner: even ? `hsl(${hue} 58% 46%)` : `hsl(${hue} 52% 38%)`,
        outer: even ? `hsl(${hue} 60% 30%)` : `hsl(${hue} 55% 24%)`,
        divider: 'rgba(255,255,255,0.18)'
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

export function drawEmptyWheel(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    palette: WheelPalette = resolveWheelPalette('purple')
): void {
    const cx = w / 2;
    const cy = h / 2;
    const outsideRadius = 200;
    const insideRadius = 52;

    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = palette.outerBg;
    ctx.fill();

    const emptyGrad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
    const { inner, outer } = segmentColors(0, palette);
    emptyGrad.addColorStop(0, inner);
    emptyGrad.addColorStop(1, outer);

    ctx.fillStyle = emptyGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
    ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI, true);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.glowRgba;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI);
    ctx.fillStyle = palette.centerBg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.borderRgba;
    ctx.stroke();
}

export function drawWheelOnCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    users: RouletteUser[],
    options: { labels?: boolean; wheelColor?: string } = {}
): void {
    const showLabels = options.labels !== false;
    const palette = resolveWheelPalette(options.wheelColor);
    const cx = w / 2;
    const cy = h / 2;
    const outsideRadius = 200;
    const textRadius = 148;
    const insideRadius = 52;
    const len = users.length;

    ctx.clearRect(0, 0, w, h);
    if (len === 0) {
        drawEmptyWheel(ctx, w, h, palette);
        return;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, outsideRadius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = palette.outerBg;
    ctx.fill();

    if (len === 1) {
        const ringGrad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
        const { inner, outer } = segmentColors(0, palette);
        ringGrad.addColorStop(0, inner);
        ringGrad.addColorStop(1, outer);

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
        ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI, true);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = palette.glowRgba;
        ctx.stroke();
    } else {
        const segments = len;
        const arc = (Math.PI * 2) / segments;

        for (let i = 0; i < segments; i++) {
            const angle = i * arc;
            const { inner, outer, divider } = segmentColors(i, palette);
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
    ctx.fillStyle = palette.centerBg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.borderRgba;
    ctx.stroke();
}
