import { describe, expect, it } from '@jest/globals';
import { AUTH_QUERY_DISPLAY_MASK } from '@/core/api/authQuery';
import { es } from '@/core/i18n/locales/es';
import {
    buildActivityTechnicalRows,
    formatActivityTime,
    mergeActivityLogs,
    sanitizeActivitySecrets,
    type ActivityLogItem
} from '@/features/dashboard/lib/logs/activityLogDisplay';

describe('formatActivityTime', () => {
    it('uses 12-hour clock with am/pm', () => {
        const morning = new Date(2026, 0, 15, 9, 7);
        const afternoon = new Date(2026, 0, 15, 14, 30);
        const midnight = new Date(2026, 0, 15, 0, 0);
        const noon = new Date(2026, 0, 15, 12, 0);

        expect(formatActivityTime(morning.toISOString())).toBe('9:07 am');
        expect(formatActivityTime(afternoon.toISOString())).toBe('2:30 pm');
        expect(formatActivityTime(midnight.toISOString())).toBe('12:00 am');
        expect(formatActivityTime(noon.toISOString())).toBe('12:00 pm');
    });

    it('returns empty string for invalid timestamps', () => {
        expect(formatActivityTime('invalid')).toBe('');
    });
});

describe('mergeActivityLogs', () => {
    const item = (timestamp: string, type: string, user: string): ActivityLogItem => ({
        timestamp,
        type,
        user,
        metadata: {}
    });
    const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

    it('keeps realtime-only rows newer than the fetch snapshot', () => {
        const older = item(iso(30_000), 'clip', 'a');
        const newer = item(iso(5_000), 'slots', 'b');
        const merged = mergeActivityLogs([older], [newer, older]);
        expect(merged).toHaveLength(2);
        expect(merged[0]?.user).toBe('b');
        expect(merged[1]?.user).toBe('a');
    });

    it('drops local rows missing from the fetch and older than it', () => {
        const fetched = item(iso(10_000), 'clip', 'a');
        const deleted = item(iso(600_000), 'slots', 'b');
        const merged = mergeActivityLogs([fetched], [deleted, fetched]);
        expect(merged).toHaveLength(1);
        expect(merged[0]?.user).toBe('a');
    });

    it('drops stale local rows when the fetch comes back empty', () => {
        const old = item(iso(600_000), 'clip', 'a');
        expect(mergeActivityLogs([], [old])).toHaveLength(0);
    });

    it('dedupes by activity key', () => {
        const row = item(iso(10_000), 'clip', 'a');
        expect(mergeActivityLogs([row], [row])).toHaveLength(1);
    });
});

describe('sanitizeActivitySecrets', () => {
    it('redacts metadata.apiKey and sensitive query params in URLs', () => {
        const input = {
            type: 'clip',
            metadata: {
                apiKey: 'sk_live_secret_value',
                url: 'https://example.com/clip?apiKey=secreto123&foo=1',
                title: 'My clip'
            }
        };
        const sanitized = sanitizeActivitySecrets(input) as typeof input;
        expect(sanitized.metadata.apiKey).toBe(AUTH_QUERY_DISPLAY_MASK);
        expect(sanitized.metadata.url).toContain(`apiKey=${AUTH_QUERY_DISPLAY_MASK}`);
        expect(sanitized.metadata.url).not.toContain('secreto123');
        expect(sanitized.metadata.url).toContain('foo=1');
        expect(sanitized.metadata.title).toBe('My clip');
        expect(JSON.stringify(sanitized)).not.toContain('sk_live_secret_value');
    });

    it('redacts nested token keys', () => {
        const sanitized = sanitizeActivitySecrets({
            metadata: { overlayToken: 'ov_secret', nested: { access_token: 'tok' } }
        }) as { metadata: { overlayToken: string; nested: { access_token: string } } };
        expect(sanitized.metadata.overlayToken).toBe(AUTH_QUERY_DISPLAY_MASK);
        expect(sanitized.metadata.nested.access_token).toBe(AUTH_QUERY_DISPLAY_MASK);
    });
});

describe('buildActivityTechnicalRows', () => {
    it('includes type, timestamp and known metadata labels without leaking apiKey', () => {
        const rows = buildActivityTechnicalRows(
            {
                type: 'clip',
                timestamp: '2026-08-27T18:00:00.000Z',
                user: 'streamer',
                metadata: {
                    title: 'Highlight',
                    url: 'https://clips.twitch.tv/abc?apiKey=leak',
                    apiKey: 'should-not-appear',
                    response: 'https://clips.twitch.tv/abc',
                    latencyMs: 42,
                    custom_flag: 'extra'
                }
            },
            es
        );

        expect(rows.map((r) => r.key)).toEqual([
            'type',
            'timestamp',
            'title',
            'url',
            'response',
            'latencyMs',
            'apiKey',
            'custom_flag'
        ]);
        expect(rows.find((r) => r.key === 'title')?.label).toBe(es.home.activityInspector.fieldTitle);
        expect(rows.find((r) => r.key === 'response')?.label).toBe(es.home.activityInspector.fieldResponse);
        expect(rows.find((r) => r.key === 'latencyMs')?.value).toBe('42 ms');
        expect(rows.find((r) => r.key === 'url')?.isUrl).toBe(true);
        expect(rows.find((r) => r.key === 'url')?.value).toContain(AUTH_QUERY_DISPLAY_MASK);
        expect(rows.find((r) => r.key === 'apiKey')?.value).toBe(AUTH_QUERY_DISPLAY_MASK);
        expect(rows.every((r) => !r.value.includes('should-not-appear') && !r.value.includes('leak'))).toBe(
            true
        );
    });
});
