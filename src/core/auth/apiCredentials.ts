/** Panel/API same-origin: always send HttpOnly session cookie (`lp_sess`).
 *  Auth model: panel = cookie; bots = apiKey (?apiKey= / x-api-key); overlay = x-overlay-token.
 *  Prefer this helper (or apiFetch) over ad-hoc credentials:'include'. */
export function withApiCredentials(init: RequestInit = {}): RequestInit {
    return {
        ...init,
        credentials: 'include'
    };
}
