import { Messages } from '../../../shared/messages/messages.js';

export const FeedbackMessages = {
    emptyMessage: 'Por favor, escribe un mensaje.',
    sending: '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...',
    defaultButton: '<i class="fa-solid fa-paper-plane"></i> Enviar Feedback',
    success: '¡Feedback enviado! Gracias por tu aporte.',
    error: 'Error al enviar. Intenta más tarde.',
    get connectionError() {
        return Messages.Common.connectionError;
    }
};
