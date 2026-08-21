/** Helpers de media de clips — resolución de URL vía API; descarga en cliente. */

const PREVIEW_SUFFIX_RE = /-preview-[^/.]+\.(?:jpg|jpeg|png|webp)$/i;

/** Helix thumbnail → URL del MP4 en el CDN de Twitch (legacy; clips nuevos suelen denegar). */
export function clipThumbnailToMp4Url(thumbnailUrl: string): string | null {
    if (!thumbnailUrl) return null;
    try {
        const url = new URL(thumbnailUrl);
        if (!/\.twitch\.tv$/i.test(url.hostname) && !/\.jtvnw\.net$/i.test(url.hostname)) {
            return null;
        }
        let path = url.pathname;
        if (PREVIEW_SUFFIX_RE.test(path)) {
            path = path.replace(PREVIEW_SUFFIX_RE, '.mp4');
        } else if (/\/AT-cm/i.test(path) && /\.(?:jpg|jpeg|png|webp)$/i.test(path)) {
            path = path.replace(/\.(?:jpg|jpeg|png|webp)$/i, '.mp4');
        } else {
            return null;
        }
        url.pathname = path;
        return url.toString();
    } catch {
        return null;
    }
}

/** Enlace al VOD en el offset del clip (si el replay sigue vivo). */
export function buildClipVodUrl(videoId?: string | null, vodOffset?: number | null): string | null {
    if (!videoId || videoId === '0') return null;
    if (vodOffset == null || !Number.isFinite(vodOffset) || vodOffset < 0) {
        return `https://www.twitch.tv/videos/${encodeURIComponent(videoId)}`;
    }
    const total = Math.floor(vodOffset);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const t = `${h}h${m}m${s}s`;
    return `https://www.twitch.tv/videos/${encodeURIComponent(videoId)}?t=${t}`;
}

export function formatClipDuration(seconds?: number | null): string | null {
    if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function csvEscape(value: unknown): string {
    const s = String(value ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function line(cells: unknown[]): string {
    return cells.map(csvEscape).join(',');
}

export interface ClipCsvRow {
    id: string;
    title?: string;
    url: string;
    creator_name?: string;
    view_count?: number;
    duration?: number;
    created_at?: string;
    video_id?: string;
    vod_offset?: number | null;
}

export function buildClipsCsv(
    clips: ClipCsvRow[],
    meta: { login: string; exportedAt: string }
): string {
    const rows: string[] = [
        line(['login', meta.login]),
        line(['exportedAt', meta.exportedAt]),
        line(['count', clips.length]),
        '',
        line([
            'id',
            'title',
            'url',
            'creator',
            'views',
            'duration_sec',
            'created_at',
            'vod_url'
        ])
    ];

    for (const clip of clips) {
        rows.push(
            line([
                clip.id,
                clip.title ?? '',
                clip.url,
                clip.creator_name ?? '',
                clip.view_count ?? '',
                clip.duration ?? '',
                clip.created_at ?? '',
                buildClipVodUrl(clip.video_id, clip.vod_offset) ?? ''
            ])
        );
    }

    return `${rows.join('\n')}\n`;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadClipsCsv(clips: ClipCsvRow[], login: string): void {
    const csv = buildClipsCsv(clips, {
        login: login || 'usuario',
        exportedAt: new Date().toISOString()
    });
    downloadBlob(
        new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
        `Clips_LosPerrisAPI_${login || 'usuario'}.csv`
    );
}

function safeClipFilename(title: string | undefined, id: string): string {
    const forbidden = new Set('<>:"/\\|?*');
    let cleaned = '';
    for (const ch of title || id || 'clip') {
        const code = ch.charCodeAt(0);
        if (code < 32 || forbidden.has(ch)) continue;
        cleaned += ch;
    }
    const base = cleaned.trim().slice(0, 80);
    return `${base || 'clip'}.mp4`;
}

function isTrustedClipMediaUrl(raw: string): boolean {
    try {
        const url = new URL(raw);
        if (url.protocol !== 'https:') return false;
        const host = url.hostname.toLowerCase();
        return (
            host.endsWith('.twitch.tv') ||
            host.endsWith('.jtvnw.net') ||
            host.endsWith('.twitchcdn.net')
        );
    } catch {
        return false;
    }
}

async function downloadMp4FromUrl(
    mp4: string,
    filename: string
): Promise<'downloaded' | 'opened' | 'unavailable'> {
    if (!isTrustedClipMediaUrl(mp4)) return 'unavailable';
    try {
        const res = await fetch(mp4, { mode: 'cors', credentials: 'omit', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        downloadBlob(blob, filename);
        return 'downloaded';
    } catch {
        window.open(mp4, '_blank', 'noopener,noreferrer');
        return 'opened';
    }
}

/**
 * Descarga el MP4. Preferir `officialUrl` (Helix clips/downloads).
 * Fallback legacy: derivar del thumbnail (clips antiguos; los nuevos suelen fallar).
 */
export async function downloadClipMp4(opts: {
    thumbnailUrl?: string;
    title?: string;
    id: string;
    officialUrl?: string | null;
}): Promise<'downloaded' | 'opened' | 'unavailable'> {
    const filename = safeClipFilename(opts.title, opts.id);
    const official = opts.officialUrl?.trim() || null;
    if (official) {
        return downloadMp4FromUrl(official, filename);
    }

    const mp4 = opts.thumbnailUrl ? clipThumbnailToMp4Url(opts.thumbnailUrl) : null;
    if (!mp4) return 'unavailable';
    return downloadMp4FromUrl(mp4, filename);
}
