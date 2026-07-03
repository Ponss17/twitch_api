export const RATE_LIMITS = {
    DEFAULT: 60, // Límite por defecto para usuarios (req/min)
    DASHBOARD: 500, // Límite para uso interno del dashboard (sesión OAuth)
    PUBLIC: 100, // Límite para IPs anónimas en rutas protegidas
    PUBLIC_HTML: 300, // Páginas públicas HTML (/, /docs) por IP
    UNAUTHORIZED: 60, // Intentos sin auth válida en rutas protegidas (anti-escaneo)
    LOGIN: 15, // Intentos de login (por 5 min)
    HEAVY: 10 // Endpoints costosos cuando se usan con API Key externa
};
