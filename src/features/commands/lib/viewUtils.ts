export function toApiTestResult(
    loading: boolean,
    stored: { status: 'success' | 'error' | null; message: string }
) {
    if (loading) return { status: 'loading' as const, message: '' };
    if (stored.status === 'success' || stored.status === 'error') {
        return { status: stored.status, message: stored.message };
    }
    return { status: 'idle' as const, message: '' };
}

export const followageErrorPattern =
    /no existe en Twitch|No se puede consultar|No se pudo consultar|No se pudo obtener|Debes ser el dueño|moderador|actualizar permisos|moderator:read:followers|Twitch no está disponible|does not exist|cannot fetch|could not fetch|must be owner|update permissions|Twitch is unavailable/i;
