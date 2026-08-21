import { useCallback, useMemo, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import {
    ANNOUNCEMENT_DISMISS_PREF,
    ANNOUNCEMENTS,
    type AnnouncementDef,
    type AnnouncementId,
    type AnnouncementSurface
} from './announcements';

function dismissKey(id: AnnouncementId): string {
    return `${ANNOUNCEMENT_DISMISS_PREF}_${id}`;
}

export function useAnnouncements(surface: AnnouncementSurface) {
    const session = useRequiredSession();
    const userId = session.userId;

    const [dismissedTick, setDismissedTick] = useState(0);

    const active = useMemo(() => {
        void dismissedTick;
        return ANNOUNCEMENTS.filter((item) => {
            if (!item.surfaces.includes(surface)) return false;
            return readScopedPref(dismissKey(item.id), userId) !== '1';
        });
    }, [dismissedTick, surface, userId]);

    const dismiss = useCallback(
        (id: AnnouncementId) => {
            writeScopedPref(dismissKey(id), userId, '1');
            setDismissedTick((n) => n + 1);
        },
        [userId]
    );

    return { announcements: active as AnnouncementDef[], dismiss };
}
