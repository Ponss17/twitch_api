export const RATE_LIMITS = {
    DASHBOARD: 500, // Sesión OAuth del dashboard — contador global en KV (`rl:sess:`)
    PUBLIC: 100, // Límite para IPs anónimas en rutas protegidas
    PUBLIC_HTML: 300, // Páginas públicas HTML (/, /docs) por IP
    UNAUTHORIZED: 60, // Intentos sin auth válida en rutas protegidas (anti-escaneo)
    LOGIN: 15, // Intentos de login (por 5 min)
    HEAVY: 10, // Endpoints costosos cuando se usan con API Key externa
    REVEAL_API_KEY: 5 // Revelar API Key en panel (por minuto / usuario)
};
