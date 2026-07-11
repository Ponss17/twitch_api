/** Peticiones al API del mismo sitio: envía la cookie HttpOnly de sesión. */
export function withApiCredentials(init: RequestInit = {}): RequestInit {
    return {
        ...init,
        credentials: 'include'
    };
}
