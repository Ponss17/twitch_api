export const RATE_LIMITS = {
    DASHBOARD: 500, // Sesión OAuth del dashboard — floor; roles altos usan rate×10 si supera esto
    PUBLIC: 100, // Límite para IPs anónimas en rutas protegidas
    PUBLIC_HTML: 300, // Páginas públicas HTML (/, /docs) por IP
    UNAUTHORIZED: 60, // Intentos sin auth válida en rutas protegidas (anti-escaneo)
    LOGIN: 15, // Intentos de login (por 5 min)
    /** Fallback legacy; la cuota real de heavy viene de USER_ROLES.heavyLimit */
    HEAVY: 5,
    REVEAL_API_KEY: 5 // Revelar API Key en panel (por minuto / usuario)
};
