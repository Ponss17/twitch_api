/** Anuncios del panel — id estable; bump el id al publicar otra novedad. */

export type AnnouncementSurface = 'home' | 'clips';

export type AnnouncementId = 'clips-download-2026-08';

export interface AnnouncementDef {
    id: AnnouncementId;
    surfaces: readonly AnnouncementSurface[];
    /** Muestra CTA para cerrar sesión y volver a conectar con Twitch. */
    requiresRelogin?: boolean;
}

export const ANNOUNCEMENTS: readonly AnnouncementDef[] = [
    {
        id: 'clips-download-2026-08',
        surfaces: ['home', 'clips'],
        requiresRelogin: true
    }
] as const;

export const ANNOUNCEMENT_DISMISS_PREF = 'feature_announce_dismissed';
