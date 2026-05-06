import { Messages } from '../../../shared/messages/messages.js';

export const CommandsMessages = {
    clipResponse: (user: string, url: string) => `🎬 Clip creado por ${user}: ${url}`,
    followageResponse: 'Procesando followage...',
    missingCreds: 'Faltan credenciales',
    completeFields: '⚠️ Por favor, ingresa el Canal y el Usuario para probar.',
    testing: Messages.Common.spinner('Probando...'),
    get connectionError() {
        return Messages.Common.dangerText('Error de conexión');
    },
    success: (text: string) =>
        `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`,
    error: (text: string) => Messages.Common.dangerText(`Error: ${text}`),
    form: {
        customMessage: 'Mensaje Personalizado (Opcional)',
        variables: 'Variables:',
        selectBot: 'Selecciona tu bot:',
        copyBtn: 'Copiar'
    }
};
