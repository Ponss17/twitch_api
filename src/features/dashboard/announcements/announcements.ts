/** Anuncios del panel — id estable; bump el id al publicar otra novedad. */

export type AnnouncementId = string & { __announcement?: never };

export type AnnouncementIcon = 'download' | 'sparkles';

/** Claves de permiso mostradas en el sheet “Actualizar permisos”. */
export type AnnouncementPermissionHint = 'clips' | 'followers' | 'chatters' | 'chat' | 'bits';

export interface AnnouncementDef {
    id: AnnouncementId;
    icon?: AnnouncementIcon;
    /** Muestra CTA para conceder scopes Twitch (force_verify). */
    requiresRelogin?: boolean;
    /** Qué permisos se piden (texto en i18n announcements.permissions.*). */
    permissionHints?: readonly AnnouncementPermissionHint[];
}

export const ANNOUNCEMENTS: readonly AnnouncementDef[] = [
    {
        id: 'bits-roulette-2026-09' as AnnouncementId,
        icon: 'sparkles'
    }
] as const;

export const ANNOUNCEMENT_DISMISS_PREF = 'feature_announce_dismissed';
