import { Messages } from '../../../shared/messages/messages.js';

export const AccountMessages = {
    testing: Messages.Common.spinner('Probando conexión...'),
    testError: '⚠️ Error en la prueba de API',
    regenerateConfirm:
        '¿Generar una nueva API Key? La anterior dejará de funcionar inmediatamente.',
    regenerateSuccess: 'Nueva API Key generada',
    regenerateError: 'Error al generar Key',
    loadingIcon: '<i class="fa-solid fa-spinner fa-spin"></i>',
    rotateIcon: '<i class="fa-solid fa-rotate"></i>'
};
