import { Messages } from './messages.js';

export const AuthMessages = {
    get sessionExpired() {
        return Messages.Common.sessionExpiredMsg;
    },
    validationError: 'Error al validar sesión',
    sessionError: 'Error de sesión. Recarga la página.',
    expiredTitle: 'Sesión Expirada',
    expiredMsg: 'Tu credencial ha caducado. Por favor, inicia sesión de nuevo.',
    reloginBtn: '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión',
    get expired() {
        return Messages.Common.sessionExpiredMsg;
    }
};
