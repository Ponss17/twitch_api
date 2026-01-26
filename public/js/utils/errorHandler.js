import { UI } from '../ui.js';
import { Messages } from './messages.js';

/**
 * Manejador Global de Errores
 * Captura errores no manejados y rechazos de promesas
 */
class ErrorHandler {
    /**
     * @type {boolean}
     */
    isDevelopment;

    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.init();
    }

    init() {
        /**
         * @param {string | Event} message - Mensaje de error
         * @param {string} [source] - Archivo fuente
         * @param {number} [lineno] - Número de línea
         * @param {number} [colno] - Número de columna
         * @param {Error} [error] - Objeto de error
         * @returns {boolean}
         */
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(message), {
                source,
                lineno,
                colno
            });
            return true;
        };

        /**
         * @param {PromiseRejectionEvent} event - Evento de rechazo de promesa
         */
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
    handleError(error, context = {}) {
        if (this.isDevelopment) {
            console.error('🔴 Error capturado por ErrorHandler:', error);
            console.error('Contexto:', context);
        }
        const userMessage = this.getUserMessage(error);
        UI.showToast(userMessage, 'error');
    }

    /**
     * Obtiene un mensaje de error amigable para el usuario
     * @param {Error | any} error - El objeto de error
     * @returns {string} Mensaje de error amigable
     */
    getUserMessage(error) {
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
            return Messages.Common.networkError || 'Error de red. Por favor, verifica tu conexión.';
        }

        if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
            return Messages.Auth.sessionExpired || 'Sesión expirada. Por favor, inicia sesión de nuevo.';
        }
        return this.isDevelopment
            ? `Error: ${error.message}`
            : 'Algo salió mal. Por favor, intenta de nuevo.';
    }

    /**
     * Reporta el error a un servicio de seguimiento (implementación futura)
     * @param {Error} error - El objeto de error
     * @param {Object} context - Contexto del error
     */
    reportError(error, context) {
        // Futuro: Sentry.captureException(error, { extra: context });
    }
}

export const errorHandler = new ErrorHandler();
