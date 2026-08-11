/** Query params que nunca deben aparecer en logs. */
const SENSITIVE_QUERY =
    /([?&])(apiKey|api_key|token|access_token|refresh_token|auth|authorization|cookie|secret|client_secret|overlayToken|code)=([^&]*)/gi;

/** Redacta secretos en query strings de URLs / originalUrl. */
export function redactSensitiveUrl(url: string): string {
    if (!url) return url;
    return url.replace(SENSITIVE_QUERY, '$1$2=[REDACTED]');
}
