import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import {
    missingPermissionHints,
    useTwitchScopes
} from '@/features/dashboard/components/UpdateTwitchPermissions';
import {
    ANNOUNCEMENT_DISMISS_PREF,
    ANNOUNCEMENTS,
    type AnnouncementDef,
    type AnnouncementId
} from './announcements';

function dismissKey(id: string): string {
    return `${ANNOUNCEMENT_DISMISS_PREF}_${id}`;
}

/** Ids previos del mismo anuncio (renombres / bumps). */
const LEGACY_DISMISS_IDS: Record<string, readonly string[]> = {
    'bits-roulette-2026-09-perms': ['bits-roulette-2026-09']
};

function isDismissed(id: AnnouncementId, userId: string | undefined): boolean {
    if (readScopedPref(dismissKey(id), userId) === '1') return true;
    const legacy = LEGACY_DISMISS_IDS[id];
    if (!legacy) return false;
    return legacy.some((oldId) => readScopedPref(dismissKey(oldId), userId) === '1');
}

export function useAnnouncements() {
    const session = useRequiredSession();
    const userId = session.userId;
    const { scopes, ready: scopesReady } = useTwitchScopes();

    const [dismissedTick, setDismissedTick] = useState(0);

    useEffect(() => {
        if (!scopesReady || !scopes) return;
        for (const item of ANNOUNCEMENTS) {
            if (!item.requiresRelogin || !item.permissionHints?.length) continue;
            if (isDismissed(item.id, userId)) continue;
            if (missingPermissionHints(scopes, item.permissionHints).length > 0) continue;
            writeScopedPref(dismissKey(item.id), userId, '1');
            setDismissedTick((n) => n + 1);
        }
    }, [scopes, scopesReady, userId]);

    const announcements = useMemo(() => {
        void dismissedTick;
        return ANNOUNCEMENTS.filter((item) => {
            if (isDismissed(item.id, userId)) return false;
            if (item.requiresRelogin && item.permissionHints?.length) {
                if (!scopesReady) return false;
                if (missingPermissionHints(scopes, item.permissionHints).length === 0) {
                    return false;
                }
            }
            return true;
        }) as AnnouncementDef[];
    }, [dismissedTick, userId, scopes, scopesReady]);

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
