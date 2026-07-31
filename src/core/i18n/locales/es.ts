/**
 * Tipo de contrato de traducciones — define las claves disponibles.
 * Los valores son `string` para que cualquier idioma pueda rellenarlas.
 */
export interface Translations {
    verifying: {
        authenticated: string;
        accessGranted: string;
        cacheActive: string;
        noCache: string;
    };
    settings: {
        title: string;
        tabs: {
            general: string;
            security: string;
            connections: string;
        };
        account: {
            title: string;
            description: string;
        };
        preferences: {
            title: string;
            description: string;
            timezone: {
                label: string;
                description: string;
                searchPlaceholder: string;
                searchAriaLabel: string;
                noResults: string;
                save: string;
                saving: string;
            };
            language: {
                label: string;
                description: string;
            };
        };
        data: {
            title: string;
            description: string;
        };
        toasts: {
            settingsSaved: string;
            settingsError: string;
            networkError: string;
        };
    };
    home: {
        welcome: string;
        quickStats: string;
        recentActivity: string;
        noActivity: string;
        requests: string;
        successRate: string;
        avgLatency: string;
        today: string;
    };
    common: {
        save: string;
        saving: string;
        cancel: string;
        confirm: string;
        copy: string;
        copied: string;
        loading: string;
        error: string;
        success: string;
    };
}

export type Locale = 'es' | 'en';

/** Traducciones por defecto en español. */
export const es: Translations = {
    verifying: {
        authenticated: 'AUTENTICADO',
        accessGranted: 'Acceso concedido. Redirigiendo...',
        cacheActive: 'Caché local activa — carga rápida.',
        noCache: 'Sincronizando perfil seguro...',
    },
    settings: {
        title: 'Ajustes',
        tabs: {
            general: 'General',
            security: 'Seguridad',
            connections: 'Conexiones',
        },
        account: {
            title: 'Cuenta',
            description: 'Identificador y límites de tu plan',
        },
        preferences: {
            title: 'Preferencias',
            description: 'Ajustes de tu cuenta',
            timezone: {
                label: 'Zona Horaria',
                description: 'Tu zona horaria se utiliza para agrupar y mostrar correctamente los días en tus estadísticas y reportes.',
                searchPlaceholder: 'Buscar zona horaria...',
                searchAriaLabel: 'Buscar zona horaria',
                noResults: 'No se encontraron resultados',
                save: 'Guardar',
                saving: 'Guardando...',
            },
            language: {
                label: 'Idioma de la Interfaz',
                description: 'Elige el idioma en que se muestra el panel de control.',
            },
        },
        data: {
            title: 'Datos',
            description: 'Exporta la información de tu cuenta',
        },
        toasts: {
            settingsSaved: 'Ajustes guardados correctamente.',
            settingsError: 'Error al guardar los ajustes.',
            networkError: 'Error de red al guardar los ajustes.',
        },
    },
    home: {
        welcome: 'Bienvenido',
        quickStats: 'Estadísticas Rápidas',
        recentActivity: 'Actividad Reciente',
        noActivity: 'Sin actividad reciente.',
        requests: 'solicitudes',
        successRate: 'tasa de éxito',
        avgLatency: 'latencia media',
        today: 'hoy',
    },
    common: {
        save: 'Guardar',
        saving: 'Guardando...',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        copy: 'Copiar',
        copied: 'Copiado',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
    },
};
