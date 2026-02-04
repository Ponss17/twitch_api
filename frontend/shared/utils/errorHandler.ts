import { UI } from '../../core/ui.js';
import { Messages } from '../i18n/messages.js';
import { AuthMessages } from '../i18n/authMessages.js';

class ErrorHandler {
    isDevelopment: boolean;

    constructor() {
        this.isDevelopment =
            window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.init();
    }

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

    handleError(error: Error | unknown, context: Record<string, unknown> = {}) {
        if (this.isDevelopment) {
            console.error('🔴 Error capturado por ErrorHandler:', error);
            console.error('Contexto:', context);
        }
        const userMessage = this.getUserMessage(error);
        UI.showToast(userMessage, 'error');
    }

    getUserMessage(error: Error | unknown): string {
        const msg = error instanceof Error ? error.message : String(error || '');

        if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
            return Messages.Common.networkError;
        }

        if (msg.includes('401') || msg.includes('unauthorized') || msg === 'auth_error') {
            return AuthMessages.sessionExpired;
        }

        if (msg.includes('403') || msg.includes('forbidden')) {
            return AuthMessages.validationError;
        }

        return this.isDevelopment
            ? `Error: ${msg}`
            : Messages.Common.error('Algo salió mal. Intenta de nuevo.');
    }

    reportError(error: Error | unknown, context: Record<string, unknown>) {
        if (this.isDevelopment) {
            console.warn('Reported Error:', error, context);
        }
    }
}

export const errorHandler = new ErrorHandler();
