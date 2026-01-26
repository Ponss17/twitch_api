import { UI } from '../ui.js';
import { Messages } from '../config/messages.js';

class ErrorHandler {
    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.init();
    }

    init() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(message), {
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

    handleError(error, context = {}) {
        if (this.isDevelopment) {
            console.error('🔴 Error caught by ErrorHandler:', error);
            console.error('Context:', context);
        }
        const userMessage = this.getUserMessage(error);
        UI.showToast(userMessage, 'error');

    }

    getUserMessage(error) {
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
            return Messages.Common.networkError || 'Network error. Please check your connection.';
        }

        if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
            return Messages.Auth.sessionExpired || 'Session expired. Please log in again.';
        }
        return this.isDevelopment
            ? `Error: ${error.message}`
            : 'Something went wrong. Please try again.';
    }

    reportError(error, context) {
    }
}

export const errorHandler = new ErrorHandler();
