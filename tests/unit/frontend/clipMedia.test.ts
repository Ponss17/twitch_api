import {
    buildClipVodUrl,
    buildClipsCsv,
    clipThumbnailToMp4Url,
    downloadClipMp4,
    formatClipDuration
} from '@/features/clips/lib/clipMedia';

describe('clipMedia', () => {
    it('clipThumbnailToMp4Url convierte preview a mp4', () => {
        const thumb =
            'https://clips-media-assets2.twitch.tv/AT-cm%7Cabc123-preview-480x272.jpg';
        expect(clipThumbnailToMp4Url(thumb)).toBe(
            'https://clips-media-assets2.twitch.tv/AT-cm%7Cabc123.mp4'
        );
    });

    it('clipThumbnailToMp4Url acepta placeholders Helix width/height', () => {
        const thumb =
            'https://clips-media-assets2.twitch.tv/AT-cm%7Cabc123-preview-%{width}x%{height}.jpg';
        expect(clipThumbnailToMp4Url(thumb)).toBe(
            'https://clips-media-assets2.twitch.tv/AT-cm%7Cabc123.mp4'
        );
    });

    it('clipThumbnailToMp4Url rechaza hosts ajenos', () => {
        expect(clipThumbnailToMp4Url('https://evil.example/foo-preview-480x272.jpg')).toBeNull();
    });

    it('downloadClipMp4 rechaza URL oficial fuera del CDN de Twitch', async () => {
        await expect(
            downloadClipMp4({
                id: 'clip1',
                officialUrl: 'https://evil.example/clip.mp4'
            })
        ).resolves.toBe('unavailable');
    });

    it('buildClipVodUrl formatea offset', () => {
        expect(buildClipVodUrl('987654321', 3723)).toBe(
            'https://www.twitch.tv/videos/987654321?t=1h2m3s'
        );
        expect(buildClipVodUrl('987654321', null)).toBe('https://www.twitch.tv/videos/987654321');
        expect(buildClipVodUrl('', 10)).toBeNull();
    });

    it('formatClipDuration redondea a m:ss', () => {
        expect(formatClipDuration(30.4)).toBe('0:30');
        expect(formatClipDuration(95)).toBe('1:35');
        expect(formatClipDuration(null)).toBeNull();
    });

    it('buildClipsCsv incluye creador y vod', () => {
        const csv = buildClipsCsv(
            [
                {
                    id: 'clip1',
                    title: 'Golazo',
                    url: 'https://clips.twitch.tv/clip1',
                    creator_name: 'Fan',
                    view_count: 10,
                    duration: 20,
                    created_at: '2026-08-20T00:00:00Z',
                    video_id: '111',
                    vod_offset: 65
                }
            ],
            { login: 'streamer', exportedAt: '2026-08-21T00:00:00.000Z' }
        );
        expect(csv).toContain('login,streamer');
        expect(csv).toContain('clip1,Golazo,');
        expect(csv).toContain('Fan,10,20,');
        expect(csv).toContain('https://www.twitch.tv/videos/111?t=0h1m5s');
    });
});
