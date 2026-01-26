/**
 * Servicio de Caché con TTL (Time To Live)
 * Almacena respuestas de API en memoria para reducir llamadas redundantes
 */

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
}

export class CacheService {
    private cache: Map<string, CacheEntry>;

    constructor() {
        this.cache = new Map();

        setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Almacena datos en caché con TTL
     * @param {string} key - Clave única para los datos
     * @param {any} data - Datos a almacenar
     * @param {number} ttl - Tiempo de vida en milisegundos
     */
    set(key, data, ttl) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * Obtiene datos del caché si no han expirado
     * @param {string} key - Clave de los datos
     * @returns {any | null} Datos almacenados o null si expiró/no existe
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;

        if (age > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Verifica si una clave existe y no ha expirado
     * @param {string} key - Clave a verificar
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Elimina una entrada específica del caché
     * @param {string} key - Clave a eliminar
     */
    clear(key) {
        this.cache.delete(key);
    }

    /**
     * Elimina todas las entradas del caché
     */
    clearAll() {
        this.cache.clear();
    }

    /**
     * Limpia entradas expiradas del caché
     */
    cleanup() {
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Obtiene estadísticas del caché
     * @returns {Object} Estadísticas del caché
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

export const CACHE_TTL = {
    CLIPS: 5 * 60 * 1000,
    USER_INFO: 10 * 60 * 1000,
    FOLLOWAGE: 30 * 60 * 1000,
    ANALYTICS: 2 * 60 * 1000
};

export const cache = new CacheService();
