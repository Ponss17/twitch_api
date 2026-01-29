import { UI } from '../ui.js';
import { Messages } from './messages.js';

/**
 * Manejador Global de Errores
 * Captura errores no manejados y rechazos de promesas
 */
class ErrorHandler {
    /** @type {boolean} Indica si el entorno es desarrollo */
    isDevelopment: boolean;

    constructor() {
        this.isDevelopment =
            window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.init();
    }

    /**
     * Inicializa los listeners globales de error
     */
    init() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(String(message)), {
                source,
                lineno,
                colno
            });
            return true;
        };

        window.onunhandledrejection = (event) => {
            this.handleError(event.reason, {
                type: 'unhandledRejection'
            });
            event.preventDefault();
        };
    }

    /**
     * Maneja un error y muestra un mensaje amigable al usuario
     * @param {Error | any} error - El objeto de error
     * @param {Object} [context={}] - Contexto adicional sobre el error
     */
    handleError(error: any, context: Record<string, any> = {}) {
        if (this.isDevelopment) {
            console.error('🔴 Error capturado por ErrorHandler:', error);
            console.error('Contexto:', context);
        }
        const userMessage = this.getUserMessage(error);
        UI.showToast(userMessage, 'error');
    }

    /**
     * Obtiene un mensaje de error amigable para el usuario basado en Messages
     * @param {Error | any} error - El objeto de error
     * @returns {string} Mensaje de error amigable
     */
    getUserMessage(error: any): string {
        const msg = error?.message || '';

        if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
            return Messages.Common.networkError;
        }

        if (msg.includes('401') || msg.includes('unauthorized') || msg === 'auth_error') {
            return Messages.Auth.sessionExpired;
        }

        if (msg.includes('403') || msg.includes('forbidden')) {
            return Messages.Auth.validationError;
        }

        return this.isDevelopment
            ? `Error: ${msg}`
            : Messages.Common.error('Algo salió mal. Intenta de nuevo.');
    }

    /**
     * Reporta el error a un servicio de seguimiento (Stub)
     * @param {Error} error - El objeto de error
     * @param {Object} context - Contexto del error
     */
    reportError(error: any, context: any) {
        // Futuro: Sentry.captureException(error, { extra: context });
        if (this.isDevelopment) {
            console.warn('Reported Error:', error, context);
        }
    }
}

export const errorHandler = new ErrorHandler();
