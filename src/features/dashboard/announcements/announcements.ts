/** Anuncios del panel — id estable; bump el id al publicar otra novedad. */

export type AnnouncementId = string & { __announcement?: never };

export type AnnouncementIcon = 'download' | 'sparkles';

export interface AnnouncementDef {
    id: AnnouncementId;
    icon?: AnnouncementIcon;
    /** Muestra CTA para cerrar sesión y volver a conectar con Twitch. */
    requiresRelogin?: boolean;
}

export const ANNOUNCEMENTS: readonly AnnouncementDef[] = [] as const;

export const ANNOUNCEMENT_DISMISS_PREF = 'feature_announce_dismissed';
