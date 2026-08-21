import type { CSSProperties } from 'react';
import { ROULETTE_COLOR_PRESETS } from '@/features/tools/roulette/lib/wheelUtils';

/** Apariencia del overlay vía query params — 0 invocaciones extra en Vercel. */

export const OVERLAY_SCALE_IDS = ['sm', 'md', 'lg'] as const;
export type OverlayScaleId = (typeof OVERLAY_SCALE_IDS)[number];

export const OVERLAY_SCALE_VALUES: Record<OverlayScaleId, number> = {
    sm: 0.85,
    md: 1,
    lg: 1.25
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface OverlayAppearance {
    /** Hex o id de preset; `null` = tema por defecto. */
    color: string | null;
    scale: OverlayScaleId;
    scaleValue: number;
}

export function isOverlayScaleId(value: string): value is OverlayScaleId {
    return (OVERLAY_SCALE_IDS as readonly string[]).includes(value);
}

export function isOverlayColorValue(value: string): boolean {
    if (!value || value === 'auto') return false;
    return HEX_RE.test(value) || /^[a-z][a-z0-9-]{0,24}$/i.test(value);
}

export function parseOverlayAppearance(search = ''): OverlayAppearance {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const colorRaw = params.get('color') || params.get('theme') || '';
    const color = isOverlayColorValue(colorRaw) ? colorRaw : null;
    const scaleRaw = params.get('scale') || 'md';
    const scale = isOverlayScaleId(scaleRaw) ? scaleRaw : 'md';
    return { color, scale, scaleValue: OVERLAY_SCALE_VALUES[scale] };
}

function colorToCssHex(color: string): string | null {
    if (HEX_RE.test(color)) return color;
    const preset = ROULETTE_COLOR_PRESETS.find((item) => item.id === color);
    if (preset && !preset.isAuto && HEX_RE.test(preset.hex)) return preset.hex;
    return null;
}

export function overlayAppearanceStyle(appearance: OverlayAppearance): CSSProperties {
    const style: CSSProperties & { zoom?: number } = {};
    if (appearance.scaleValue !== 1) {
        style.zoom = appearance.scaleValue;
    }
    const hex = appearance.color ? colorToCssHex(appearance.color) : null;
    if (hex) {
        (style as Record<string, string>)['--primary'] = hex;
        (style as Record<string, string>)['--color-primary'] = hex;
        (style as Record<string, string>)['--brand-text'] = hex;
    }
    return style;
}

/** Añade color/scale a la URL copiable. Omite valores por defecto. */
export function appendOverlayAppearanceParams(
    rawUrl: string,
    appearance: { color?: string | null; scale?: OverlayScaleId | null }
): string {
    if (!rawUrl) return '';
    const color = appearance.color && appearance.color !== 'auto' ? appearance.color : null;
    const scale = appearance.scale && appearance.scale !== 'md' ? appearance.scale : null;
    if (!color && !scale) return rawUrl;

    try {
        const urlObj = new URL(
            rawUrl,
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
        );
        if (color) urlObj.searchParams.set('color', color);
        else urlObj.searchParams.delete('color');
        if (scale) urlObj.searchParams.set('scale', scale);
        else urlObj.searchParams.delete('scale');
        return urlObj.toString();
    } catch {
        const extra: string[] = [];
        if (color) extra.push(`color=${encodeURIComponent(color)}`);
        if (scale) extra.push(`scale=${encodeURIComponent(scale)}`);
        const sep = rawUrl.includes('?') ? '&' : '?';
        return `${rawUrl}${sep}${extra.join('&')}`;
    }
}
