import { useCallback, useMemo, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import {
    ANNOUNCEMENT_DISMISS_PREF,
    ANNOUNCEMENTS,
    type AnnouncementDef,
    type AnnouncementId
} from './announcements';

function dismissKey(id: AnnouncementId): string {
    return `${ANNOUNCEMENT_DISMISS_PREF}_${id}`;
}

export function useAnnouncements() {
    const session = useRequiredSession();
    const userId = session.userId;

    const [dismissedTick, setDismissedTick] = useState(0);

    const announcements = useMemo(() => {
        void dismissedTick;
        return ANNOUNCEMENTS.filter(
            (item) => readScopedPref(dismissKey(item.id), userId) !== '1'
        ) as AnnouncementDef[];
    }, [dismissedTick, userId]);

    const dismiss = useCallback(
        (id: AnnouncementId) => {
            writeScopedPref(dismissKey(id), userId, '1');
            setDismissedTick((n) => n + 1);
        },
        [userId]
    );

    const dismissAll = useCallback(() => {
        for (const item of ANNOUNCEMENTS) {
            writeScopedPref(dismissKey(item.id), userId, '1');
        }
        setDismissedTick((n) => n + 1);
    }, [userId]);

    return { announcements, count: announcements.length, dismiss, dismissAll };
}
