import {
    ANNOUNCEMENTS,
    ANNOUNCEMENT_DISMISS_PREF,
    type AnnouncementId
} from '@/features/dashboard/announcements/announcements';

describe('announcements config', () => {


    test('ids son estables y únicos', () => {
        const ids = ANNOUNCEMENTS.map((a) => a.id);
        expect(new Set(ids).size).toBe(ids.length);
        ids.forEach((id: AnnouncementId) => {
            expect(id.length).toBeGreaterThan(3);
        });
    });

    test('prefijo de dismiss es estable', () => {
        expect(ANNOUNCEMENT_DISMISS_PREF).toBe('feature_announce_dismissed');
    });
});
