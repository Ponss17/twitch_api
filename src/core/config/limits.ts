export const RATE_LIMITS = {
    DEFAULT: 120, // Límite por defecto para usuarios (req/min)
    DASHBOARD: 1000, // Límite para uso interno del dashboard
    PUBLIC: 1000, // Límite para recursos estáticos y rutas públicas
    ADMIN_API: 100, // Límite para la API de administración (por 15 min)
    LOGIN: 5, // Intentos de login (por 15 min)
    HEAVY: 10 // Endpoints costosos cuando se usan con API Key externa
};
